import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    const { locationId, value } = body;

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    if (value !== 1 && value !== -1 && value !== 0) {
      return NextResponse.json(
        { error: "Value must be 1 (upvote), -1 (downvote), or 0 (remove)" },
        { status: 400 }
      );
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const userId = session.user.id;

    if (value === 0) {
      // Remove vote
      await prisma.vote.deleteMany({
        where: {
          userId,
          locationId,
        },
      });
    } else {
      // Upsert vote
      await prisma.vote.upsert({
        where: {
          userId_locationId: {
            userId,
            locationId,
          },
        },
        update: {
          value,
        },
        create: {
          userId,
          locationId,
          value,
        },
      });
    }

    // Get updated vote counts
    const votes = await prisma.vote.groupBy({
      by: ["value"],
      where: { locationId },
      _count: true,
    });

    const upvotes = votes.find((v) => v.value === 1)?._count ?? 0;
    const downvotes = votes.find((v) => v.value === -1)?._count ?? 0;

    // Get user's current vote
    const userVote = await prisma.vote.findUnique({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
    });

    return NextResponse.json({
      upvotes,
      downvotes,
      userVote: userVote?.value ?? null,
    });
  } catch (error) {
    console.error("Error handling vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
