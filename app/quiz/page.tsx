"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function QuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const generating = searchParams.get("generating");

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

  if (!session) {
    return null;
  }

  if (generating) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-lg text-gray-600">Generating quiz...</p>
      </div>
    );
  }

  router.push("/folders");
  return null;
}
