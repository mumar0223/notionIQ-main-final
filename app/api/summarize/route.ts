import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateResponse } from "@/lib/gemini";
import { downloadFileFromUT } from "@/lib/uploadthing";
import { parseFile } from "@/lib/fileParser";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await req.json();

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const blob = await downloadFileFromUT(file.url);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { text } = await parseFile(buffer, file.type);

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: `Summary: ${file.originalName}`,
        type: "summary",
        fileId: file.id,
        folderId: file.folderId,
      },
    });

    const prompt = `Please provide a comprehensive summary of the following document:\n\n${text.slice(0, 30000)}`;
    
    const summary = await generateResponse(prompt);

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: summary,
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      summary,
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "Failed to summarize file" },
      { status: 500 }
    );
  }
}
