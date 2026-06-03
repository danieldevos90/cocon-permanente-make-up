/** Verbose server logs when WHATSAPP_API_LOG=true or LOG_LEVEL=debug (Vercel Runtime Logs). */
export function apiLog(tag: string, message: string, data?: Record<string, unknown>) {
  const verbose =
    process.env.WHATSAPP_API_LOG === "true" ||
    process.env.LOG_LEVEL === "debug";
  if (!verbose) return;
  if (data) {
    console.log(`[${tag}] ${message}`, JSON.stringify(data));
  } else {
    console.log(`[${tag}] ${message}`);
  }
}
