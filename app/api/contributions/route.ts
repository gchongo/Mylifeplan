import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import {
  createContribution,
  getContributionsInRange,
  serializeContribution,
} from "@/lib/services/contribution";
import { createContributionSchema } from "@/lib/validations/contribution";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const planId = searchParams.get("planId");

    let items = await getContributionsInRange(session.userId, from, to);
    if (planId) items = items.filter((c) => c.planId === planId);

    return jsonOk({ contributions: items });
  } catch (error) {
    return handleProtectedRouteError(error, "api/contributions GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = await request.json();
    const parsed = createContributionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const contribution = await createContribution(session.userId, parsed.data);
    return jsonOk({ contribution: serializeContribution(contribution) }, 201);
  } catch (e) {
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("创建失败", 500);
  }
}
