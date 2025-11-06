"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HistorySidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });

  return (
    <div
      className={`${
        isExpanded ? "w-64" : "w-0"
      } bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">History</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="p-4">
        <Link
          href="/chat"
          className="flex items-center gap-2 w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Chat</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.map((conv: any) => (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
              pathname === `/chat/${conv.id}`
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-200 text-gray-700"
            }`}
          >
            <MessageSquare size={16} />
            <span className="truncate text-sm">{conv.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
