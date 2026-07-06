"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { UserRole } from "@/store/slices/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User doesn't have the required role, redirect to a safe place
    // You could redirect to a generic "dashboard" or a "unauthorized" page
    router.replace("/dashboard");
    return null;
  }

  return <>{children}</>;
};
