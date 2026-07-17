"use client";

import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
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

          <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}