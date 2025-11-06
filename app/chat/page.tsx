"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Loader2 } from "lucide-react";
import { useEffect, Suspense } from "react";

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const summarizing = searchParams.get("summarizing");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!session) return null;

  if (summarizing) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-lg text-gray-600">Generating summary...</p>
      </div>
    );
  }

  return <ChatInterface userId={session.user.id} />;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
