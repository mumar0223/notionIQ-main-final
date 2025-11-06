import { Sidebar } from "@/components/layout/Sidebar";
import { HistorySidebar } from "@/components/layout/HistorySidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <HistorySidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
