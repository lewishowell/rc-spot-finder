import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyFriends } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const rigs = await prisma.rig.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        modifications: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(rigs);
  } catch (error) {
    console.error("Error fetching rigs:", error);
    return NextResponse.json(
      { error: "Failed to fetch rigs" },
      { status: 500 }
    );
  }
}

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
    const { manufacturer, model, nickname, imageUrl, notes } = body;

    if (!manufacturer || !model) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const rig = await prisma.rig.create({
      data: {
        manufacturer,
        model,
        nickname: nickname || null,
        imageUrl: imageUrl || null,
        notes: notes || null,
        userId: session.user.id,
      },
      include: {
        modifications: true,
        user: {
          select: { name: true, username: true },
        },
      },
    });

    // Notify friends (fire and forget)
    const actorName = rig.user?.username
      ? `@${rig.user.username}`
      : rig.user?.name || "Someone";
    notifyFriends(
      session.user.id,
      "friend_new_rig",
      `${actorName} added a new rig: ${manufacturer} ${model}`,
      rig.id
    );

    return NextResponse.json(rig, { status: 201 });
  } catch (error) {
    console.error("Error creating rig:", error);
    return NextResponse.json(
      { error: "Failed to create rig" },
      { status: 500 }
    );
  }
}
