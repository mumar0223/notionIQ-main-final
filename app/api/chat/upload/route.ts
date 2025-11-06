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

    if (!file) {
      return NextResponse.json(
        { error: "File required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text, pages, imageData } = await parseFile(buffer, file.type);

    const { url, key } = await uploadFileToUT(file);

    const dbFile = await prisma.file.create({
      data: {
        name: key,
        originalName: file.name,
        type: file.type,
        size: file.size,
        pages,
        url,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id: dbFile.id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: dbFile.url,
      text: text?.slice(0, 15000),
      imageData,
    });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
