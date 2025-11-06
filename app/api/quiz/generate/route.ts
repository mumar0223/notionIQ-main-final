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

    const { fileId, pyqFileId } = await req.json();

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (!file.folderId) {
      return NextResponse.json(
        { error: "File must be in a folder to generate quiz" },
        { status: 400 }
      );
    }

    const blob = await downloadFileFromUT(file.url);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { text } = await parseFile(buffer, file.type);

    let pyqContext = "";
    if (pyqFileId) {
      const pyqFile = await prisma.file.findUnique({
        where: { id: pyqFileId },
      });
      if (pyqFile && pyqFile.userId === session.user.id) {
        const pyqBlob = await downloadFileFromUT(pyqFile.url);
        const pyqBuffer = Buffer.from(await pyqBlob.arrayBuffer());
        const pyqParsed = await parseFile(pyqBuffer, pyqFile.type);
        pyqContext = `\n\nPrevious Year Questions for reference:\n${pyqParsed.text.slice(0, 5000)}`;
      }
    }

    const prompt = `Based on the following content, generate 10 quiz questions with multiple choice answers. ${pyqContext ? "Use the PYQ patterns as reference for question styles." : ""}

Content:
${text.slice(0, 20000)}

Return a JSON array with this exact structure:
[
  {
    "question": "question text",
    "type": "multiple-choice",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "option1",
    "explanation": "explanation text"
  }
]

Only return the JSON array, no additional text.`;

    const response = await generateResponse(prompt);
    
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const questionsData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const quiz = await prisma.quiz.create({
      data: {
        title: `Quiz: ${file.originalName}`,
        folderId: file.folderId,
        fileId: file.id,
      },
    });

    for (let i = 0; i < questionsData.length; i++) {
      const q = questionsData[i];
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: i,
        },
      });
    }

    return NextResponse.json({ quizId: quiz.id });
  } catch (error) {
    console.error("Generate quiz error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
