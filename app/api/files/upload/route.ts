import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFileToUT } from "@/lib/uploadthing";
import { parseFile } from "@/lib/fileParser";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;

    if (!file || !folderId) {
      return NextResponse.json(
        { error: "File and folder ID required" },
        { status: 400 }
      );
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text, pages } = await parseFile(buffer, file.type);

    const { url, key } = await uploadFileToUT(file);

    const dbFile = await prisma.file.create({
      data: {
        name: key,
        originalName: file.name,
        type: file.type,
        size: file.size,
        pages,
        url,
        folderId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(dbFile, { status: 201 });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
