import { cookies } from "next/headers";

const COOKIE_NAME = "dashboard_auth";

/** Returns true when no password is configured (open dashboard) or cookie is valid. */
export async function isDashboardAuthenticated(): Promise<boolean> {
  if (!process.env.DASHBOARD_PASSWORD) return true;
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "1";
}
