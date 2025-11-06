import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuizInterface } from "@/components/quiz/QuizInterface";

export default async function QuizPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // ✅ Await params before accessing
  const { id } = await params;

  return <QuizInterface quizId={id} userId={session.user.id} />;
}
