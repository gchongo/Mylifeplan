import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAMES } from "@/lib/auth/session";

const PUBLIC_PAGES = ["/login", "/register", "/admin/login"];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API auth runs in Node route handlers (runtime AUTH_SECRET). Edge middleware
  // only sees build-time env and can reject valid cookies after deploy.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const loggedIn = hasSessionCookie(request);

  if (PUBLIC_PAGES.includes(pathname)) {
    if (loggedIn && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (loggedIn && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    }
    return NextResponse.next();
  }

  if (!loggedIn) {
    const login = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(login, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
