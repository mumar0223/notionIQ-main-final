import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuizInterface } from "@/components/quiz/QuizInterface";

export default async function QuizPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <QuizInterface quizId={params.id} userId={session.user.id} />;
}
