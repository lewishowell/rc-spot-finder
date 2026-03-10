import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Validate the URL is from Instagram's CDN
    const url = new URL(imageUrl);
    const allowedHosts = [
      "scontent.cdninstagram.com",
      "instagram.com",
      "cdninstagram.com",
    ];
    const isAllowed = allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Invalid image source" },
        { status: 400 }
      );
    }

    // Upload the Instagram image to Cloudinary
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "rc-spot-finder",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });

    return NextResponse.json({ imageUrl: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error("Error importing Instagram photo:", error);
    const message = error instanceof Error ? error.message : "Failed to import photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
