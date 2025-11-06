import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FoldersView } from "@/components/folders/FoldersView";

export default async function FoldersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <FoldersView userId={session.user.id} />;
}
