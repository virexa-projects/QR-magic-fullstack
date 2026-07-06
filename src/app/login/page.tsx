"use client";

import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, ArrowRight, Eye, EyeOff, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/auth";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginUser } from "@/store/slices/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading: authLoading } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      router.push("/dashboard");
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  const copyVal = (val: string, kind: "email" | "password") => {
    navigator.clipboard.writeText(val);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: form */}
      <div className="flex flex-col p-6 md:p-10">
        <Link href="/" className="flex items-center gap-2.5 mb-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-blue flex items-center justify-center shadow-blue">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-heading text-foreground">QRBharat</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto py-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground">Welcome back</h1>
          <p className="mt-2 text-muted-foreground text-sm">Log in to manage your QR codes and analytics.</p>

          {/* Demo creds card */}
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary-soft p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Demo Account</span>
            </div>
            <div className="space-y-2 text-sm">
              <button
                type="button"
                onClick={() => copyVal(DEMO_EMAIL, "email")}
                className="w-full flex items-center justify-between bg-card rounded-lg px-3 py-2 hover:bg-card/80 transition"
              >
                <span className="font-mono text-foreground">{DEMO_EMAIL}</span>
                {copied === "email" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <button
                type="button"
                onClick={() => copyVal(DEMO_PASSWORD, "password")}
                className="w-full flex items-center justify-between bg-card rounded-lg px-3 py-2 hover:bg-card/80 transition"
              >
                <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
                {copied === "password" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
            <Button
              type="button"
              onClick={fillDemo}
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-primary hover:bg-primary/10 h-8 text-xs font-semibold"
            >
              Auto-fill demo credentials
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-card border-border"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-card border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold shadow-blue"
            >
              {authLoading ? "Signing in…" : <>Sign in <ArrowRight className="w-4 h-4 ml-1.5" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to QRBharat?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </motion.div>

        <p className="text-xs text-muted-foreground mt-auto">© 2026 QRBharat · Made in India 🇮🇳</p>
      </div>

      {/* Right: visual */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-blue items-center justify-center p-10">
        <div className="absolute inset-0 grid-pattern opacity-[0.06]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary-glow/30 rounded-full blur-[120px]" />

        <div className="relative max-w-md text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 backdrop-blur text-xs font-semibold mb-6">
            ⚡ Trusted by 50,000+ businesses
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading leading-tight">
            Track every scan. Edit any QR. Anytime.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Dynamic QR codes let you change destinations after printing. Real-time analytics show you
            exactly when, where, and how often each code is scanned.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { v: "2.4M+", l: "Scans tracked" },
              { v: "99.9%", l: "Uptime" },
              { v: "<100ms", l: "Redirect speed" },
            ].map((s) => (
              <div key={s.l} className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
                <div className="text-xl font-bold font-heading">{s.v}</div>
                <div className="text-[10px] text-primary-foreground/70 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
