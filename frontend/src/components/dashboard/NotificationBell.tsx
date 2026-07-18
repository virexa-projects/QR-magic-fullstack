"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Scan, MousePointerClick, AlertTriangle, CreditCard, Info } from "lucide-react";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";

const ICONS: Record<AppNotification["type"], React.ElementType> = {
  scan: Scan,
  click: MousePointerClick,
  limit_warning: AlertTriangle,
  subscription: CreditCard,
  system: Info,
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[12px] leading-4 text-primary-foreground text-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                You're all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => {
                  const Icon = ICONS[n.type] ?? Info;
                  return (
                    <li key={n._id}>
                      <button
                        onClick={() => !n.isRead && markAsRead(n._id)}
                        className={`w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-secondary transition-colors ${
                          n.isRead ? "" : "bg-secondary/40"
                        }`}
                      >
                        <span className="shrink-0 w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.message}
                          </span>
                          <span className="block text-[11px] text-muted-foreground/70 mt-1">
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}