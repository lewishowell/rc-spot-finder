import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRegionFromCoordinates } from "@/lib/geocode";

// POST /api/admin/backfill-regions
// Backfill regions for all spots that don't have one
export async function POST() {
  try {
    // Temporarily disabled auth for one-time backfill
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    // Find all locations without a region
    const locationsWithoutRegion = await prisma.location.findMany({
      where: {
        region: null,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    if (locationsWithoutRegion.length === 0) {
      return NextResponse.json({
        message: "No locations need region backfill",
        updated: 0,
      });
    }

    const results: { id: string; name: string; region: string | null }[] = [];

    // Process each location with a small delay to respect Nominatim rate limits
    for (const location of locationsWithoutRegion) {
      const region = await getRegionFromCoordinates(location.latitude, location.longitude);

      if (region) {
        await prisma.location.update({
          where: { id: location.id },
          data: { region },
        });
        results.push({ id: location.id, name: location.name, region });
      } else {
        results.push({ id: location.id, name: location.name, region: null });
      }

      // Rate limit: wait 1 second between requests to Nominatim
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      message: `Processed ${locationsWithoutRegion.length} locations`,
      updated: results.filter((r) => r.region !== null).length,
      results,
    });
  } catch (error) {
    console.error("Error backfilling regions:", error);
    return NextResponse.json(
      { error: "Failed to backfill regions" },
      { status: 500 }
    );
  }
}
