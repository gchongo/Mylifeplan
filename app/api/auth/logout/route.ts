import { NextResponse } from "next/server";
import { SESSION_COOKIE, LEGACY_SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const cleared = { ...sessionCookieOptions(0), maxAge: 0 };
  response.cookies.set(SESSION_COOKIE, "", cleared);
  response.cookies.set(LEGACY_SESSION_COOKIE, "", cleared);
  return response;
}
