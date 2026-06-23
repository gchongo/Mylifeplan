import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { getPlanSummary } from "@/lib/services/summary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const summary = await getPlanSummary(session.userId);
    return jsonOk({ summary });
  } catch (error) {
    return handleProtectedRouteError(error, "api/summary GET");
  }
}
