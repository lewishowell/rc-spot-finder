import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: "receiverId is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Can't friend yourself
    if (userId === receiverId) {
      return NextResponse.json(
        { error: "You cannot send a friend request to yourself" },
        { status: 400 }
      );
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for existing request from sender to receiver
    const existingRequest = await prisma.friendship.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json(
          { error: "Friend request already sent" },
          { status: 409 }
        );
      }
      if (existingRequest.status === "accepted") {
        return NextResponse.json(
          { error: "You are already friends" },
          { status: 409 }
        );
      }
      if (existingRequest.status === "rejected") {
        // Check 7-day cooldown
        const daysSinceRejection =
          (Date.now() - existingRequest.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceRejection < 7) {
          return NextResponse.json(
            { error: "You must wait before sending another request to this user" },
            { status: 429 }
          );
        }
        // Cooldown passed, update the existing rejected request to pending
        const updated = await prisma.friendship.update({
          where: { id: existingRequest.id },
          data: { status: "pending" },
        });
        return NextResponse.json(updated, { status: 201 });
      }
    }

    // Check for reverse request (receiver -> sender)
    const reverseRequest = await prisma.friendship.findUnique({
      where: {
        senderId_receiverId: {
          senderId: receiverId,
          receiverId: userId,
        },
      },
    });

    if (reverseRequest) {
      if (reverseRequest.status === "accepted") {
        return NextResponse.json(
          { error: "You are already friends" },
          { status: 409 }
        );
      }
      if (reverseRequest.status === "pending") {
        // Auto-accept: the other person already sent a request
        const accepted = await prisma.friendship.update({
          where: { id: reverseRequest.id },
          data: { status: "accepted" },
        });
        return NextResponse.json(accepted, { status: 200 });
      }
      if (reverseRequest.status === "rejected") {
        // Check 7-day cooldown on the reverse rejected request
        const daysSinceRejection =
          (Date.now() - reverseRequest.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceRejection < 7) {
          return NextResponse.json(
            { error: "You must wait before sending another request to this user" },
            { status: 429 }
          );
        }
      }
    }

    // Create new friend request
    const friendship = await prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId,
        status: "pending",
      },
      include: {
        sender: { select: { name: true, username: true } },
      },
    });

    // Notify the receiver
    const senderName = friendship.sender?.username
      ? `@${friendship.sender.username}`
      : friendship.sender?.name || "Someone";
    notifyUser(receiverId, userId, "friend_request", `${senderName} sent you a friend request`);

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    );
  }
}
