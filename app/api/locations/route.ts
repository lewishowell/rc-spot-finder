import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classification = searchParams.get("classification");
    const region = searchParams.get("region");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = {};

    if (classification && classification !== "all") {
      where.classification = classification;
    }

    if (region && region !== "all") {
      where.region = region;
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        associatedHobbyShop: true,
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, latitude, longitude, classification, rating, imageUrl, region, associatedHobbyShopId } = body;

    if (!name || latitude === undefined || longitude === undefined || !classification || rating === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!["bash", "race", "crawl", "hobby", "airfield"].includes(classification)) {
      return NextResponse.json(
        { error: "Invalid classification" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        description: description || null,
        latitude,
        longitude,
        classification,
        rating,
        imageUrl: imageUrl || null,
        region: region || null,
        associatedHobbyShopId: associatedHobbyShopId || null,
      },
      include: {
        associatedHobbyShop: true,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
