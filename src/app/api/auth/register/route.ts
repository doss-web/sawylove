import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

// In-memory rate limiter: max 5 registrations per IP per 15 minutes
const rateMap = new Map<string, { count: number; resetAt: number }>();
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW = 15 * 60 * 1000; // 15 min

function checkRegisterRate(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + REGISTER_WINDOW });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= REGISTER_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRegisterRate(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${Math.ceil(rate.retryAfter / 60)} minutes.` },
      { status: 429 },
    );
  }

  const { email, password, name } = await req.json();

  // Validate
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  // Validate & sanitize name
  if (name && (typeof name !== "string" || name.length > 50)) {
    return NextResponse.json({ error: "Name must be under 50 characters" }, { status: 400 });
  }
  const safeName = name ? name.trim().slice(0, 50) : undefined;

  // Check if user already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Create user + credential account in a transaction
  const hashedPassword = await hash(password, 12);
  const user = await db.user.create({
    data: {
      email,
      name: safeName || email.split("@")[0],
      accounts: {
        create: {
          providerId: "credential",
          accountId: email,
          password: hashedPassword,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
