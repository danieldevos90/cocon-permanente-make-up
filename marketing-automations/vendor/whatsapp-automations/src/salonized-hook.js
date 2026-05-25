export async function onTreatmentProcessed() {
  return { skipped: true, reason: 'whatsapp-stub' };
}

export async function runScheduledSends() {
  return { checked: 0, sent: 0, skipped: 0, failed: 0 };
}
