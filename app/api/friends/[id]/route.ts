import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const userId = session.user.id;

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 }
      );
    }

    if (friendship.status !== "accepted") {
      return NextResponse.json(
        { error: "This friendship is not active" },
        { status: 400 }
      );
    }

    // Either sender or receiver can unfriend
    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      return NextResponse.json(
        { error: "You are not part of this friendship" },
        { status: 403 }
      );
    }

    await prisma.friendship.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json(
      { error: "Failed to remove friend" },
      { status: 500 }
    );
  }
}
