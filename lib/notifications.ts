import { prisma } from "@/lib/prisma";

export async function notifyFriends(
  actorId: string,
  type: string,
  message: string,
  linkId?: string
) {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ senderId: actorId }, { receiverId: actorId }],
      },
      select: { senderId: true, receiverId: true },
    });

    const friendIds = friendships.map((f) =>
      f.senderId === actorId ? f.receiverId : f.senderId
    );

    if (friendIds.length > 0) {
      await prisma.notification.createMany({
        data: friendIds.map((uid) => ({
          userId: uid,
          type,
          message,
          linkId: linkId || null,
          actorId,
        })),
      });
    }
  } catch (error) {
    // Fire and forget - don't let notification failures block the main action
    console.error("Error creating notifications:", error);
  }
}

export async function notifyUser(
  userId: string,
  actorId: string,
  type: string,
  message: string,
  linkId?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        linkId: linkId || null,
        actorId,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
