import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInstagramMedia } from "@/lib/instagram";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session.user.instagramAccessToken) {
      return NextResponse.json(
        { error: "Instagram account not connected. Please connect your Instagram account first." },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const after = searchParams.get("after") || undefined;

    const media = await getInstagramMedia(
      session.user.instagramAccessToken,
      Math.min(limit, 50),
      after
    );

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching Instagram media:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch Instagram media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
