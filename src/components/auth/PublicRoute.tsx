"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If logged in, redirect away from public pages (like login/register)
    if (!loading && isAuthenticated) {
      router.replace("/dashboard"); // or another default authenticated route
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};
