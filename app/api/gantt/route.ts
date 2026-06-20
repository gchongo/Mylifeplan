import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { getGanttData } from "@/lib/services/view-data";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const { items, contributions } = await getGanttData(session.userId, from, to);
    return jsonOk({ items, contributions });
  } catch {
    return jsonError("未登录", 401);
  }
}
