import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { publishToInstagram, getInstagramBusinessAccountId } from "@/lib/instagram";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { imageUrl, caption } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Get the Instagram Business Account ID
    const igBusinessAccountId = await getInstagramBusinessAccountId(
      session.user.instagramAccessToken
    );

    if (!igBusinessAccountId) {
      return NextResponse.json(
        {
          error:
            "No Instagram Business/Creator account found. Please ensure your Instagram account is a Business or Creator account linked to a Facebook Page.",
        },
        { status: 403 }
      );
    }

    const result = await publishToInstagram(
      session.user.instagramAccessToken,
      igBusinessAccountId,
      imageUrl,
      caption || ""
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error publishing to Instagram:", error);
    const message = error instanceof Error ? error.message : "Failed to publish to Instagram";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
