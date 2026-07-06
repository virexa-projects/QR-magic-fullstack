"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-blue flex items-center justify-center shadow-blue">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-heading text-foreground tracking-tight">QRBharat</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <button onClick={() => scrollTo("features")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</button>
          <button onClick={() => scrollTo("generator")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Generator</button>
          <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
          <Button variant="ghost" size="sm" asChild className="text-foreground">
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 shadow-blue">
            <Link href="/login">Start Free</Link>
          </Button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background border-t border-border px-4 py-4 space-y-3"
        >
          <button onClick={() => scrollTo("features")} className="block w-full text-left text-sm py-2">Features</button>
          <button onClick={() => scrollTo("generator")} className="block w-full text-left text-sm py-2">Generator</button>
          <button onClick={() => scrollTo("pricing")} className="block w-full text-left text-sm py-2">Pricing</button>
          <Button asChild className="w-full bg-primary text-primary-foreground">
            <Link href="/login">Start Free</Link>
          </Button>
        </motion.div>
      )}
    </nav>
  );
}
