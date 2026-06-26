import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PRIVATE_NO_STORE } from "@/lib/api-response";
import { SESSION_COOKIE_NAMES } from "@/lib/auth/session";

const PUBLIC_PAGES = ["/login", "/register", "/admin/login"];

function applyNoStoreHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(PRIVATE_NO_STORE)) {
    response.headers.set(key, value);
  }
  return response;
}

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return applyNoStoreHeaders(NextResponse.next());
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
    return applyNoStoreHeaders(NextResponse.redirect(new URL(login, request.url)));
  }

  return applyNoStoreHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
