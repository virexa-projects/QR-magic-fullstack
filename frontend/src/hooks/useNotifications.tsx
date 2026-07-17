"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export interface AppNotification {
  _id: string;
  type: "scan" | "click" | "limit_warning" | "subscription" | "system";
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// NEXT_PUBLIC_API_URL already includes the /api/v1 prefix — don't append it again.
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/notifications?limit=20`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          setNotifications(data.items);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live updates
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const onNew = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    };

    const onConnectError = (err: Error) => {
      console.error("[socket] connect_error:", err.message);
    };
    const onConnect = () => {
      console.log("[socket] connected, id:", socket.id);
    };
    const onDisconnect = (reason: string) => {
      console.log("[socket] disconnected:", reason);
    };

    socket.on("notification:new", onNew);
    socket.on("connect_error", onConnectError);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("notification:new", onNew);
      socket.off("connect_error", onConnectError);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to mark all notifications read", err);
    }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}