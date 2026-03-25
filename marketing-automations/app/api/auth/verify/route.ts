import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dashboard_auth";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  const hasPassword = !!process.env.DASHBOARD_PASSWORD;
  const authenticated = hasPassword && cookie?.value === "1";

  return NextResponse.json({ authenticated, hasPassword });
}
