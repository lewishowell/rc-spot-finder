import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    if (friendship.status !== "pending") {
      return NextResponse.json(
        { error: "This request is no longer pending" },
        { status: 400 }
      );
    }

    // Only the receiver can accept or reject
    if (friendship.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the receiver can accept or reject a friend request" },
        { status: 403 }
      );
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: {
        status: action === "accept" ? "accepted" : "rejected",
      },
      include: {
        receiver: { select: { name: true, username: true } },
      },
    });

    // Notify the sender when their request is accepted
    if (action === "accept") {
      const accepterName = updated.receiver?.username
        ? `@${updated.receiver.username}`
        : updated.receiver?.name || "Someone";
      notifyUser(friendship.senderId, session.user.id, "friend_accepted", `${accepterName} accepted your friend request`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating friend request:", error);
    return NextResponse.json(
      { error: "Failed to update friend request" },
      { status: 500 }
    );
  }
}

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

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    if (friendship.status !== "pending") {
      return NextResponse.json(
        { error: "This request is no longer pending" },
        { status: 400 }
      );
    }

    // Only the sender can cancel
    if (friendship.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the sender can cancel a friend request" },
        { status: 403 }
      );
    }

    await prisma.friendship.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling friend request:", error);
    return NextResponse.json(
      { error: "Failed to cancel friend request" },
      { status: 500 }
    );
  }
}
