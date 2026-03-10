import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "accepted";
    const direction = searchParams.get("direction");

    if (status === "pending") {
      if (!direction || (direction !== "sent" && direction !== "received")) {
        return NextResponse.json(
          { error: "direction must be 'sent' or 'received' when status is pending" },
          { status: 400 }
        );
      }

      const friendships = await prisma.friendship.findMany({
        where: {
          status: "pending",
          ...(direction === "sent"
            ? { senderId: userId }
            : { receiverId: userId }),
        },
        include: {
          sender: {
            select: { id: true, name: true, image: true, username: true },
          },
          receiver: {
            select: { id: true, name: true, image: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const results = friendships.map((f) => ({
        friendshipId: f.id,
        user: direction === "sent" ? f.receiver : f.sender,
        createdAt: f.createdAt,
      }));

      return NextResponse.json(results);
    }

    // Default: accepted friends
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, username: true },
        },
        receiver: {
          select: { id: true, name: true, image: true, username: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = friendships.map((f) => ({
      friendshipId: f.id,
      user: f.senderId === userId ? f.receiver : f.sender,
      since: f.updatedAt,
    }));

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}
