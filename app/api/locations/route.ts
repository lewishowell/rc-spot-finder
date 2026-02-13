import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRegionFromCoordinates } from "@/lib/geocode";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const searchParams = request.nextUrl.searchParams;
    const classification = searchParams.get("classification");
    const region = searchParams.get("region");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const mySpots = searchParams.get("mySpots") === "true";

    const where: Record<string, unknown> = {};

    if (classification && classification !== "all") {
      where.classification = classification;
    }

    if (region && region !== "all") {
      where.region = region;
    }

    // Filter to only show user's spots if mySpots is true and user is logged in
    if (mySpots && userId) {
      where.userId = userId;
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: sortBy === "votes"
        ? undefined // We'll sort in memory for votes
        : { [sortBy]: sortOrder },
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

    // Transform locations to include vote counts and user's vote
    const transformedLocations = locations.map((loc) => {
      const upvotes = loc.votes.filter((v) => v.value === 1).length;
      const downvotes = loc.votes.filter((v) => v.value === -1).length;
      const userVote = userId
        ? loc.votes.find((v) => v.userId === userId)?.value ?? null
        : null;
      const isOwner = userId === loc.userId;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { votes, ...locationWithoutVotes } = loc;

      return {
        ...locationWithoutVotes,
        upvotes,
        downvotes,
        userVote,
        isOwner,
      };
    });

    // Sort by votes if requested
    if (sortBy === "votes") {
      transformedLocations.sort((a, b) => {
        const aScore = a.upvotes - a.downvotes;
        const bScore = b.upvotes - b.downvotes;
        return sortOrder === "desc" ? bScore - aScore : aScore - bScore;
      });
    }

    return NextResponse.json(transformedLocations);
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, latitude, longitude, classification, imageUrl, region, associatedHobbyShopId } = body;

    if (!name || latitude === undefined || longitude === undefined || !classification) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["bash", "race", "crawl", "hobby", "airfield", "boat"].includes(classification)) {
      return NextResponse.json(
        { error: "Invalid classification" },
        { status: 400 }
      );
    }

    // Auto-detect region if not provided
    let finalRegion = region || null;
    if (!finalRegion && latitude && longitude) {
      finalRegion = await getRegionFromCoordinates(latitude, longitude);
    }

    const location = await prisma.location.create({
      data: {
        name,
        description: description || null,
        latitude,
        longitude,
        classification,
        imageUrl: imageUrl || null,
        region: finalRegion,
        associatedHobbyShopId: associatedHobbyShopId || null,
        userId: session.user.id,
      },
      include: {
        associatedHobbyShop: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...location,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      isOwner: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
