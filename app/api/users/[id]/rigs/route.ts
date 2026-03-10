import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Check user exists and has public profile
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        profileVisibility: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.profileVisibility !== "public") {
      return NextResponse.json(
        { error: "This user's profile is not public" },
        { status: 403 }
      );
    }

    const rigs = await prisma.rig.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { modifications: true },
        },
      },
    });

    const result = rigs.map((rig) => ({
      id: rig.id,
      manufacturer: rig.manufacturer,
      model: rig.model,
      nickname: rig.nickname,
      imageUrl: rig.imageUrl,
      notes: rig.notes,
      createdAt: rig.createdAt,
      modificationCount: rig._count.modifications,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching user rigs:", error);
    return NextResponse.json(
      { error: "Failed to fetch user rigs" },
      { status: 500 }
    );
  }
}
