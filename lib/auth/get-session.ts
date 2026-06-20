import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";

type RequestLike = Pick<NextRequest, "cookies" | "headers">;

function parseCookieHeader(header: string, name: string): string | undefined {
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (key !== name) continue;
    const raw = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

function tokenFromRequest(request: RequestLike): string | undefined {
  const fromCookies = request.cookies.get(SESSION_COOKIE)?.value;
  if (fromCookies) return fromCookies;

  const header = request.headers.get("cookie");
  if (!header) return undefined;
  return parseCookieHeader(header, SESSION_COOKIE);
}

async function sessionFromToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSession(request?: RequestLike): Promise<SessionPayload | null> {
  if (request) {
    const fromRequest = await sessionFromToken(tokenFromRequest(request));
    if (fromRequest) return fromRequest;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return sessionFromToken(token);
}

export async function requireSession(request?: RequestLike): Promise<SessionPayload> {
  const session = await getSession(request);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin(request?: RequestLike): Promise<SessionPayload> {
  const session = await requireSession(request);
  if (session.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
