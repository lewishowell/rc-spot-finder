import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        bio: true,
        instagram: true,
        profileVisibility: true,
        createdAt: true,
        _count: {
          select: {
            locations: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check visibility
    const isOwnProfile = session?.user?.id === id;
    if (!isOwnProfile && user.profileVisibility === "private") {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 });
    }

    // Check friend status
    let friendStatus: "none" | "pending_sent" | "pending_received" | "friends" = "none";
    let friendRequestId: string | null = null;

    if (session?.user?.id && !isOwnProfile) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: id },
            { senderId: id, receiverId: session.user.id },
          ],
          status: { in: ["pending", "accepted"] },
        },
      });

      if (friendship) {
        friendRequestId = friendship.id;
        if (friendship.status === "accepted") {
          friendStatus = "friends";
        } else if (friendship.senderId === session.user.id) {
          friendStatus = "pending_sent";
        } else {
          friendStatus = "pending_received";
        }
      }

      // If profile is friends-only and not friends, hide details
      if (user.profileVisibility === "friends" && friendStatus !== "friends") {
        return NextResponse.json({
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
          friendStatus,
          friendRequestId,
          restricted: true,
        });
      }
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      image: user.image,
      username: user.username,
      bio: user.bio,
      instagram: user.instagram,
      createdAt: user.createdAt,
      spotCount: user._count.locations,
      friendStatus,
      friendRequestId,
      restricted: false,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
