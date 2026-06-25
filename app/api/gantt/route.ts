import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { getGanttData } from "@/lib/services/view-data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const { items, contributions } = await getGanttData(session.userId, from, to);
    return jsonOk({ items, contributions });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[api/gantt GET]", error.message, error.stack);
    } else {
      console.error("[api/gantt GET]", error);
    }
    return handleProtectedRouteError(error, "api/gantt GET");
  }
}
