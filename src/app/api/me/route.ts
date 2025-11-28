import { stackServerApp } from "@/stack/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await stackServerApp.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });

  return NextResponse.json({
    userId: user.id,
    email: user.primaryEmail,
    name: user.displayName,
    image: user.profileImageUrl,
    plan: dbUser?.plan || 'FREE',
  });
}
