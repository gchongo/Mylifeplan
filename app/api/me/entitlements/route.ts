import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { getEffectiveLimits } from "@/lib/entitlements";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const entitlements = await getEffectiveLimits(session.userId);
    return jsonOk({ entitlements });
  } catch (error) {
    return handleProtectedRouteError(error, "api/me/entitlements GET");
  }
}
