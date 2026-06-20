import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
