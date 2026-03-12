import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const count = await prisma.friendship.count({
      where: {
        receiverId: session.user.id,
        status: "pending",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching pending count:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending count" },
      { status: 500 }
    );
  }
}
