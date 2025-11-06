import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FoldersView } from "@/components/folders/FoldersView";

export default async function FolderPage({ params }: { params: { folderId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <FoldersView userId={session.user.id} initialFolderId={params.folderId} />;
}
