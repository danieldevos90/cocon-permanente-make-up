/**
 * Meta WhatsApp webhook parser + signature verifier.
 *
 * Documentatie:
 *   https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 *   https://developers.facebook.com/docs/graph-api/webhooks/getting-started#validate-payloads
 *
 * Coexistence note:
 *   In coexistence mode kan een binnenkomend bericht ZOWEL aan de
 *   WhatsApp Business app op de telefoon als aan deze webhook geleverd
 *   worden. We loggen alles, maar antwoorden NIET automatisch — Daniela
 *   reageert vanaf de telefoon. Pas in Fase 2 voegen we keyword-routing
 *   toe wanneer we patronen zien in echte replies.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

/**
 * Verifieer de X-Hub-Signature-256 header van een Meta webhook POST.
 *
 * @param {string} rawBody  De ruwe request body (string, niet geparsed!)
 * @param {string} signatureHeader  De volledige header, bv. "sha256=abc..."
 * @returns {boolean}
 */
export function verifyMetaSignature(rawBody, signatureHeader) {
  if (!config.meta.appSecret) {
    console.warn('[wa-webhook] META_WHATSAPP_APP_SECRET ontbreekt — signature niet verifieerd!');
    return false;
  }
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const expected = createHmac('sha256', config.meta.appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');
  const received = signatureHeader.slice('sha256='.length);

  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Parse een Meta WhatsApp webhook payload naar simpele genormaliseerde
 * `messages` en `statuses` lijsten. Onbekende velden worden genegeerd.
 *
 * Returnt:
 *   {
 *     messages: [{ from, profileName, type, text, waMessageId, timestamp, replyToTemplate? }],
 *     statuses: [{ recipient, waMessageId, status, timestamp, errorCode? }],
 *   }
 */
export function parseInboundWebhook(payload) {
  const messages = [];
  const statuses = [];

  if (!payload || payload.object !== 'whatsapp_business_account') {
    return { messages, statuses };
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;
      const value = change.value || {};
      const contacts = value.contacts || [];
      const contactByPhone = {};
      for (const c of contacts) {
        if (c.wa_id) contactByPhone[c.wa_id] = c;
      }

      for (const msg of value.messages || []) {
        const contact = contactByPhone[msg.from] || {};
        const normalized = {
          from: msg.from,
          profileName: contact?.profile?.name || null,
          waMessageId: msg.id,
          timestamp: msg.timestamp,
          type: msg.type,
        };

        if (msg.type === 'text') {
          normalized.text = msg.text?.body || '';
        } else if (msg.type === 'button') {
          normalized.text = msg.button?.text || '';
          normalized.buttonPayload = msg.button?.payload || '';
        } else if (msg.type === 'interactive') {
          const ir = msg.interactive?.button_reply || msg.interactive?.list_reply;
          normalized.text = ir?.title || '';
          normalized.buttonId = ir?.id || '';
        } else if (msg.type === 'reaction') {
          normalized.text = msg.reaction?.emoji || '';
          normalized.reactionTo = msg.reaction?.message_id || '';
        } else if (msg.type === 'image' || msg.type === 'audio' || msg.type === 'video' || msg.type === 'document' || msg.type === 'sticker') {
          const media = msg[msg.type] || {};
          normalized.mediaId = media.id;
          normalized.mediaMimeType = media.mime_type;
          normalized.text = media.caption || '';
        } else if (msg.type === 'location') {
          normalized.text = msg.location?.name || `${msg.location?.latitude},${msg.location?.longitude}`;
        }

        if (msg.context?.id) {
          normalized.repliedToMessageId = msg.context.id;
        }

        messages.push(normalized);
      }

      for (const st of value.statuses || []) {
        statuses.push({
          recipient: st.recipient_id,
          waMessageId: st.id,
          status: st.status,
          timestamp: st.timestamp,
          errorCode: st.errors?.[0]?.code,
          errorMessage: st.errors?.[0]?.message,
          conversationId: st.conversation?.id,
          pricingCategory: st.pricing?.category,
        });
      }
    }
  }

  return { messages, statuses };
}

export default { verifyMetaSignature, parseInboundWebhook };
