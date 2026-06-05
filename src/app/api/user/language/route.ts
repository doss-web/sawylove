import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language } = await req.json();
  if (!["en", "zh"].includes(language)) return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  await db.user.update({ where: { email: session.user.email }, data: { language } });
  return NextResponse.json({ success: true });
}
