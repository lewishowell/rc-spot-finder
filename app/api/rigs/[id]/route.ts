import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const userId = session?.user?.id;

    const rig = await prisma.rig.findUnique({
      where: { id },
      include: {
        modifications: {
          orderBy: { sortOrder: "asc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            profileVisibility: true,
          },
        },
      },
    });

    if (!rig) {
      return NextResponse.json(
        { error: "Rig not found" },
        { status: 404 }
      );
    }

    const isOwner = userId === rig.userId;

    // Only allow access if the user is the owner or the owner's profile is public
    if (!isOwner && rig.user.profileVisibility !== "public") {
      return NextResponse.json(
        { error: "Rig not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...rig,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching rig:", error);
    return NextResponse.json(
      { error: "Failed to fetch rig" },
      { status: 500 }
    );
  }
}

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

    const { manufacturer, model, nickname, imageUrl, notes } = body;

    const existingRig = await prisma.rig.findUnique({
      where: { id },
    });

    if (!existingRig) {
      return NextResponse.json(
        { error: "Rig not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingRig.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own rigs" },
        { status: 403 }
      );
    }

    const rig = await prisma.rig.update({
      where: { id },
      data: {
        manufacturer: manufacturer ?? existingRig.manufacturer,
        model: model ?? existingRig.model,
        nickname: nickname !== undefined ? nickname : existingRig.nickname,
        imageUrl: imageUrl !== undefined ? imageUrl : existingRig.imageUrl,
        notes: notes !== undefined ? notes : existingRig.notes,
      },
      include: {
        modifications: {
          orderBy: { sortOrder: "asc" },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...rig,
      isOwner: true,
    });
  } catch (error) {
    console.error("Error updating rig:", error);
    return NextResponse.json(
      { error: "Failed to update rig" },
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

    const existingRig = await prisma.rig.findUnique({
      where: { id },
    });

    if (!existingRig) {
      return NextResponse.json(
        { error: "Rig not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingRig.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own rigs" },
        { status: 403 }
      );
    }

    // Delete all modifications first, then the rig
    await prisma.modification.deleteMany({
      where: { rigId: id },
    });

    await prisma.rig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rig:", error);
    return NextResponse.json(
      { error: "Failed to delete rig" },
      { status: 500 }
    );
  }
}
