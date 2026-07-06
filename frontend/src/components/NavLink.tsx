"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends LinkProps {
  className?: string;
  activeClassName?: string;
  children?: React.ReactNode;
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, end, ...props }, ref) => {
    const pathname = usePathname();
    const targetPath = typeof href === "string" ? href : href.pathname ?? "";
    const isActive = end ? pathname === targetPath : (pathname ?? "").startsWith(targetPath);

    return (
      <Link ref={ref} href={href} className={cn(className, isActive && activeClassName)} {...props} />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
