import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAMES,
  type SessionPayload,
} from "@/lib/auth/session";

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

function tokenFromCookieHeader(header: string): string | undefined {
  for (const name of SESSION_COOKIE_NAMES) {
    const token = parseCookieHeader(header, name);
    if (token) return token;
  }
  return undefined;
}

function tokenFromRequest(request: RequestLike): string | undefined {
  for (const name of SESSION_COOKIE_NAMES) {
    const fromCookies = request.cookies.get(name)?.value;
    if (fromCookies) return fromCookies;
  }

  const header = request.headers.get("cookie");
  if (!header) return undefined;
  return tokenFromCookieHeader(header);
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
  for (const name of SESSION_COOKIE_NAMES) {
    const token = cookieStore.get(name)?.value;
    const session = await sessionFromToken(token);
    if (session) return session;
  }
  return null;
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
