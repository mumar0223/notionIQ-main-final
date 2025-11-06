import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId, newOrder } = await req.json();

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Folder not found or unauthorized" },
        { status: 403 }
      );
    }

    await prisma.folder.update({
      where: { id: folderId },
      data: { order: newOrder },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder folder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder folder" },
      { status: 500 }
    );
  }
}
