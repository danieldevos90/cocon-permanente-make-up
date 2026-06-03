import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "dashboard_auth";

export function middleware(request: NextRequest) {
  const hasPassword = !!process.env.DASHBOARD_PASSWORD;
  if (!hasPassword) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Legacy demo tenant → marketing test
  const legacyDemo = pathname.match(/^\/t\/demo-salon(\/.*)?$/);
  if (legacyDemo) {
    const rest = legacyDemo[1] || "";
    return NextResponse.redirect(new URL(`/t/marketing-test${rest}`, request.url));
  }

  const isLogin = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isWhatsAppPublic =
    pathname.startsWith("/whatsapp/onboard") ||
    pathname === "/api/whatsapp-webhook" ||
    pathname === "/api/whatsapp-onboard";
  const cookie = request.cookies.get(COOKIE_NAME);

  if (isWhatsAppPublic) {
    return NextResponse.next();
  }

  // API routes: JWT / bearer / cookie checked in route handlers
  if (pathname.startsWith("/api/v1/") || pathname.startsWith("/api/whatsapp-test-send")) {
    return NextResponse.next();
  }

  if (isLogin) {
    if (cookie?.value === "1") {
      return NextResponse.redirect(new URL("/platform", request.url));
    }
    return NextResponse.next();
  }

  if (isAuthApi) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/t/") || pathname.startsWith("/platform") || pathname === "/") {
    if (cookie?.value !== "1") {
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/") {
        loginUrl.searchParams.set("from", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/platform",
    "/dashboard",
    "/dashboard/:path*",
    "/t/:path*",
    "/login",
    "/api/auth/:path*",
    "/whatsapp/onboard",
    "/api/whatsapp-webhook",
    "/api/whatsapp-onboard",
    "/api/whatsapp-test-send",
    "/api/v1/:path*",
  ],
};
