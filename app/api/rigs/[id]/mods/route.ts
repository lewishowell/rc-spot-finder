import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const validCategories = [
  "Motor",
  "ESC",
  "Battery",
  "Servo",
  "Chassis",
  "Suspension",
  "Tires",
  "Body",
  "Drivetrain",
  "Electronics",
  "Other",
];

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const rig = await prisma.rig.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!rig) {
      return NextResponse.json(
        { error: "Rig not found" },
        { status: 404 }
      );
    }

    const modifications = await prisma.modification.findMany({
      where: { rigId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(modifications);
  } catch (error) {
    console.error("Error fetching modifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch modifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const rig = await prisma.rig.findUnique({
      where: { id },
    });

    if (!rig) {
      return NextResponse.json(
        { error: "Rig not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (rig.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only add modifications to your own rigs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, brand, name, notes, sortOrder } = body;

    if (!category || !brand || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // If no sortOrder provided, place at the end
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const lastMod = await prisma.modification.findFirst({
        where: { rigId: id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = lastMod ? lastMod.sortOrder + 1 : 0;
    }

    const modification = await prisma.modification.create({
      data: {
        category,
        brand,
        name,
        notes: notes || null,
        sortOrder: finalSortOrder,
        rigId: id,
      },
    });

    return NextResponse.json(modification, { status: 201 });
  } catch (error) {
    console.error("Error creating modification:", error);
    return NextResponse.json(
      { error: "Failed to create modification" },
      { status: 500 }
    );
  }
}
