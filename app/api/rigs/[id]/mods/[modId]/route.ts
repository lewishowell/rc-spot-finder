import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string; modId: string }>;
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

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id, modId } = await context.params;
    const body = await request.json();

    const { category, brand, name, notes, sortOrder } = body;

    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

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
        { error: "You can only edit modifications on your own rigs" },
        { status: 403 }
      );
    }

    const existingMod = await prisma.modification.findUnique({
      where: { id: modId },
    });

    if (!existingMod || existingMod.rigId !== id) {
      return NextResponse.json(
        { error: "Modification not found" },
        { status: 404 }
      );
    }

    const modification = await prisma.modification.update({
      where: { id: modId },
      data: {
        category: category ?? existingMod.category,
        brand: brand ?? existingMod.brand,
        name: name ?? existingMod.name,
        notes: notes !== undefined ? notes : existingMod.notes,
        sortOrder: sortOrder !== undefined ? sortOrder : existingMod.sortOrder,
      },
    });

    return NextResponse.json(modification);
  } catch (error) {
    console.error("Error updating modification:", error);
    return NextResponse.json(
      { error: "Failed to update modification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id, modId } = await context.params;

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
        { error: "You can only delete modifications on your own rigs" },
        { status: 403 }
      );
    }

    const existingMod = await prisma.modification.findUnique({
      where: { id: modId },
    });

    if (!existingMod || existingMod.rigId !== id) {
      return NextResponse.json(
        { error: "Modification not found" },
        { status: 404 }
      );
    }

    await prisma.modification.delete({
      where: { id: modId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting modification:", error);
    return NextResponse.json(
      { error: "Failed to delete modification" },
      { status: 500 }
    );
  }
}
