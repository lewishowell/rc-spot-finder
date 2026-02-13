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

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        associatedHobbyShop: true,
        votes: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const upvotes = location.votes.filter((v) => v.value === 1).length;
    const downvotes = location.votes.filter((v) => v.value === -1).length;
    const userVote = userId
      ? location.votes.find((v) => v.userId === userId)?.value ?? null
      : null;
    const isOwner = userId === location.userId;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { votes, ...locationWithoutVotes } = location;

    return NextResponse.json({
      ...locationWithoutVotes,
      upvotes,
      downvotes,
      userVote,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
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

    const { name, description, latitude, longitude, classification, imageUrl, region, associatedHobbyShopId } = body;

    if (classification && !["bash", "race", "crawl", "hobby", "airfield", "boat"].includes(classification)) {
      return NextResponse.json(
        { error: "Invalid classification" },
        { status: 400 }
      );
    }

    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingLocation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own locations" },
        { status: 403 }
      );
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: name ?? existingLocation.name,
        description: description !== undefined ? description : existingLocation.description,
        latitude: latitude ?? existingLocation.latitude,
        longitude: longitude ?? existingLocation.longitude,
        classification: classification ?? existingLocation.classification,
        imageUrl: imageUrl !== undefined ? imageUrl : existingLocation.imageUrl,
        region: region !== undefined ? region : existingLocation.region,
        associatedHobbyShopId: associatedHobbyShopId !== undefined ? (associatedHobbyShopId || null) : existingLocation.associatedHobbyShopId,
      },
      include: {
        associatedHobbyShop: true,
        votes: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const upvotes = location.votes.filter((v) => v.value === 1).length;
    const downvotes = location.votes.filter((v) => v.value === -1).length;
    const userVote = location.votes.find((v) => v.userId === session.user.id)?.value ?? null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { votes, ...locationWithoutVotes } = location;

    return NextResponse.json({
      ...locationWithoutVotes,
      upvotes,
      downvotes,
      userVote,
      isOwner: true,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
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

    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingLocation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own locations" },
        { status: 403 }
      );
    }

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
