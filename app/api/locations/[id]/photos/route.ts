import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_PHOTOS_PER_SPOT = 20;

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const photos = await prisma.spotPhoto.findMany({
      where: { locationId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

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
    const { imageUrl, caption } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Check photo limit
    const count = await prisma.spotPhoto.count({ where: { locationId: id } });
    if (count >= MAX_PHOTOS_PER_SPOT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS_PER_SPOT} photos per spot` },
        { status: 400 }
      );
    }

    const photo = await prisma.spotPhoto.create({
      data: {
        imageUrl,
        caption: caption?.trim() || null,
        userId: session.user.id,
        locationId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error adding photo:", error);
    return NextResponse.json(
      { error: "Failed to add photo" },
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
    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    const photo = await prisma.spotPhoto.findUnique({
      where: { id: photoId },
      include: { location: { select: { userId: true } } },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    // Allow deletion by photo uploader or spot owner
    const isPhotoOwner = photo.userId === session.user.id;
    const isSpotOwner = photo.location.userId === session.user.id;

    if (!isPhotoOwner && !isSpotOwner) {
      return NextResponse.json(
        { error: "You can only delete your own photos or photos on your spots" },
        { status: 403 }
      );
    }

    await prisma.spotPhoto.delete({ where: { id: photoId } });

    // Return updated count
    const remaining = await prisma.spotPhoto.count({ where: { locationId: id } });

    return NextResponse.json({ success: true, photoCount: remaining });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
