import 'dotenv/config';

/**
 * Configuration for Cocon Cosmetics Marketing Automations
 */
export const config = {
  mailchimp: {
    apiKey: process.env.API_KEY_MAILCHIMP,
    serverPrefix: process.env.API_KEY_MAILCHIMP?.split('-')[1] || 'us1',
    listId: process.env.MAILCHIMP_LIST_ID || '',
  },
  
  urls: {
    review: process.env.REVIEW_URL || 'https://cocon-cosmetics.nl/reviews',
    booking: process.env.BOOKING_URL || 'https://www.coconpermanentemakeup.nl/afspraak-maken',
    portfolio: process.env.PORTFOLIO_URL || 'https://cocon-cosmetics.nl/portfolio',
  },

  // Treatment types available
  treatmentTypes: ['wenkbrauwen', 'eyeliner', 'lippen'],

  // Email timing configuration (in days)
  emailTiming: {
    aftercare: 0,           // Immediately after treatment
    weekFollowup: 7,        // 1 week after treatment
    reviewRequest: 21,      // 3 weeks after (after healing)
    touchupReminder: 42,    // 6 weeks after treatment
  },

  // Sender information (must match a verified Mailchimp domain)
  sender: {
    name: 'Cocon Cosmetics',
    email: process.env.SENDER_EMAIL || 'info@coconcosmetics.nl',
  },

  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
  },
};

/**
 * Validate configuration
 */
export function validateConfig() {
  const errors = [];
  
  if (!config.mailchimp.apiKey) {
    errors.push('API_KEY_MAILCHIMP is required in .env');
  }
  
  if (!config.mailchimp.listId) {
    errors.push('MAILCHIMP_LIST_ID is required in .env (run "npm run sync" to see available lists)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default config;
