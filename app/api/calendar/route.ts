import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { getCalendarItems } from "@/lib/services/view-data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const items = await getCalendarItems(session.userId, from, to);
    return jsonOk({ items });
  } catch (error) {
    return handleProtectedRouteError(error, "api/calendar GET");
  }
}
