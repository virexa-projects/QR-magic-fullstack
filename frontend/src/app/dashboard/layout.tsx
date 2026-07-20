"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { getPendingQrDraft } from "@/utils/pendingQrDraft";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Draft resume redirect.
   * Whenever the user lands on any dashboard page (most commonly /dashboard
   * after logging in), check if they have an unfinished QR draft in
   * localStorage. If yes, send them to the create page with ?resume=true so
   * useQrDraftRestore can pick it up and auto-save.
   *
   * We skip the redirect if they're already on /dashboard/create (the hook
   * there will handle it) to avoid a redirect loop.
   */
  useEffect(() => {
    if (pathname === "/dashboard/create") return; // already there — hook handles it
    const draft = getPendingQrDraft();
    if (draft) {
      router.replace("/dashboard/create?resume=true");
    }
  // Only run once on mount — if the path changes while the draft still
  // exists (e.g. after a failed auto-save) we don't want to keep bouncing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/40">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1 max-w-md hidden md:block">
              <SearchBar />
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1  overflow-x-hidden px-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}