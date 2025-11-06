"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  MessageSquare,
  FolderOpen,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/folders", icon: FolderOpen, label: "Folders" },
  ];

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-gray-900 text-white flex flex-col transition-all duration-300`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {!isCollapsed && <h1 className="text-xl font-bold">EduAI</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300"
        >
          <User size={20} />
          {!isCollapsed && <span>Profile</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
