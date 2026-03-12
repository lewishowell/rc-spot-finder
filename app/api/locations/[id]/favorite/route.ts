import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Toggle: check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_locationId: {
          userId: session.user.id,
          locationId: id,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      const count = await prisma.favorite.count({ where: { locationId: id } });
      return NextResponse.json({ isFavorited: false, favoriteCount: count });
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          locationId: id,
        },
      });
      const count = await prisma.favorite.count({ where: { locationId: id } });
      return NextResponse.json({ isFavorited: true, favoriteCount: count });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
