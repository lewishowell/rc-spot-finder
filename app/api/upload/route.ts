import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Check Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary environment variables");
      return NextResponse.json(
        { error: "Image upload not configured. Please contact support." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("Upload attempt:", { name: file.name, type: file.type, size: file.size });

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

    // Determine mime type - iOS sometimes doesn't provide it
    let mimeType = file.type;
    if (!mimeType || mimeType === "application/octet-stream") {
      // Detect from magic bytes
      const header = buffer.slice(0, 4).toString("hex");
      if (header.startsWith("ffd8ff")) {
        mimeType = "image/jpeg";
      } else if (header.startsWith("89504e47")) {
        mimeType = "image/png";
      } else if (header.startsWith("47494638")) {
        mimeType = "image/gif";
      } else if (header.startsWith("52494646")) {
        mimeType = "image/webp";
      } else {
        // Default to JPEG for unknown (common for HEIC converted by iOS)
        mimeType = "image/jpeg";
      }
    }

    const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
