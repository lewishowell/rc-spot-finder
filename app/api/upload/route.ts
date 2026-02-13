import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Accept common image types including iOS HEIC/HEIF
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
    ];
    // Also check if it starts with "image/" for broader compatibility
    if (!file.type.startsWith("image/") && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB (Cloudinary will optimize)
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary with automatic optimization
    const result = await cloudinary.uploader.upload(base64, {
      folder: "rc-spot-finder",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" }, // Max dimensions
        { quality: "auto:good" }, // Automatic quality optimization
        { fetch_format: "auto" }, // Serve WebP when supported
      ],
    });

    return NextResponse.json({ imageUrl: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
