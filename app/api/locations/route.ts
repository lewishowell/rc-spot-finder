import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRegionFromCoordinates } from "@/lib/geocode";
import { notifyFriends } from "@/lib/notifications";

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
      where.classifications = { has: classification };
    }

    if (region && region !== "all") {
      where.region = region;
    }

    // Filter to only show user's spots if mySpots is true and user is logged in
    if (mySpots && userId) {
      where.userId = userId;
    }

    const myFavorites = searchParams.get("myFavorites") === "true";

    if (myFavorites && userId) {
      where.favorites = { some: { userId } };
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: sortBy === "votes" || sortBy === "distance"
        ? undefined // We'll sort in memory
        : { [sortBy]: sortOrder },
      include: {
        associatedHobbyShop: true,
        votes: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
            checkIns: true,
            photos: true,
          },
        },
        ...(userId ? {
          favorites: {
            where: { userId },
            select: { id: true },
          },
        } : {}),
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
      const { votes, _count, favorites, ...locationWithoutVotes } = loc as typeof loc & { favorites?: { id: string }[] };

      return {
        ...locationWithoutVotes,
        upvotes,
        downvotes,
        userVote,
        isOwner,
        commentCount: _count.comments,
        favoriteCount: _count.favorites,
        checkInCount: _count.checkIns,
        photoCount: _count.photos,
        isFavorited: Array.isArray(favorites) && favorites.length > 0,
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
    const { name, description, latitude, longitude, classifications, imageUrl, region, associatedHobbyShopId } = body;

    if (!name || latitude === undefined || longitude === undefined || !classifications) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validClassifications = ["bash", "race", "crawl", "hobby", "airfield", "boat", "drone"];
    if (!Array.isArray(classifications) || classifications.length === 0 || !classifications.every((c: string) => validClassifications.includes(c))) {
      return NextResponse.json(
        { error: "Invalid classifications" },
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
        classifications,
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
            username: true,
          },
        },
      },
    });

    // Notify friends (fire and forget)
    const actorName = location.user?.username
      ? `@${location.user.username}`
      : location.user?.name || "Someone";
    notifyFriends(
      session.user.id,
      "friend_new_spot",
      `${actorName} added a new spot: ${name}`,
      location.id
    );

    return NextResponse.json({
      ...location,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      isOwner: true,
      commentCount: 0,
      favoriteCount: 0,
      checkInCount: 0,
      photoCount: 0,
      isFavorited: false,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
