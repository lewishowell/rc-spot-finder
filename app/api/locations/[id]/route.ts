import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
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
    const { id } = await context.params;
    const body = await request.json();

    const { name, description, latitude, longitude, classification, rating, imageUrl, region, associatedHobbyShopId } = body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (classification && !["bash", "race", "crawl", "hobby", "airfield"].includes(classification)) {
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

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: name ?? existingLocation.name,
        description: description !== undefined ? description : existingLocation.description,
        latitude: latitude ?? existingLocation.latitude,
        longitude: longitude ?? existingLocation.longitude,
        classification: classification ?? existingLocation.classification,
        rating: rating ?? existingLocation.rating,
        imageUrl: imageUrl !== undefined ? imageUrl : existingLocation.imageUrl,
        region: region !== undefined ? region : existingLocation.region,
        associatedHobbyShopId: associatedHobbyShopId !== undefined ? (associatedHobbyShopId || null) : existingLocation.associatedHobbyShopId,
      },
      include: {
        associatedHobbyShop: true,
      },
    });

    return NextResponse.json(location);
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
