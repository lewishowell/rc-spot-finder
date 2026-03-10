import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        bio: true,
        profileVisibility: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, bio, profileVisibility } = body;

    // Build update data only with provided fields
    const data: Record<string, unknown> = {};

    if (username !== undefined) {
      if (username === null || username === "") {
        data.username = null;
      } else {
        // Validate username: alphanumeric + underscores, 3-20 chars
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
          return NextResponse.json(
            { error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" },
            { status: 400 }
          );
        }

        // Check uniqueness
        const existing = await prisma.user.findUnique({
          where: { username },
        });

        if (existing && existing.id !== session.user.id) {
          return NextResponse.json(
            { error: "Username is already taken" },
            { status: 409 }
          );
        }

        data.username = username;
      }
    }

    if (bio !== undefined) {
      data.bio = bio || null;
    }

    if (profileVisibility !== undefined) {
      const validVisibilities = ["public", "friends", "private"];
      if (!validVisibilities.includes(profileVisibility)) {
        return NextResponse.json(
          { error: "profileVisibility must be 'public', 'friends', or 'private'" },
          { status: 400 }
        );
      }
      data.profileVisibility = profileVisibility;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        username: true,
        bio: true,
        profileVisibility: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
