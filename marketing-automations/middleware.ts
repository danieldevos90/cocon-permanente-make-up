import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "dashboard_auth";

export function middleware(request: NextRequest) {
  const hasPassword = !!process.env.DASHBOARD_PASSWORD;
  if (!hasPassword) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isAuthApi =
    pathname.startsWith("/api/auth/") || pathname === "/api/auth/login";
  const cookie = request.cookies.get(COOKIE_NAME);

  if (isLogin) {
    if (cookie?.value === "1") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isAuthApi) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") || pathname === "/") {
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
  matcher: ["/", "/dashboard", "/dashboard/:path*", "/login", "/api/auth/:path*"],
};
