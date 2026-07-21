"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store";
import { registerUser } from "@/store/slices/authSlice";
import { GoogleAuthButtons } from "@/components/auth/GoogleAuthButtons";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";

type RegisterFieldErrors = Partial<Record<keyof RegisterFormData, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading: authLoading } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});

  const clearError = (field: keyof RegisterFormData) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse({ name, email, phone, password });

    if (!result.success) {
      const fieldErrors: RegisterFieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const resultAction = await dispatch(registerUser(result.data));
    if (registerUser.fulfilled.match(resultAction)) {
       router.push("/verify-email");
    }
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
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground">Create account</h1>
          <p className="mt-2 text-muted-foreground text-sm">Sign up to start creating dynamic QR codes.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`h-11 bg-card border-border ${
                  errors.name ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-destructive mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`h-11 bg-card border-border ${
                  errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError("phone");
                }}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={`h-11 bg-card border-border ${
                  errors.phone ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
              {errors.phone && (
                <p id="phone-error" className="text-xs text-destructive mt-1">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`h-11 bg-card border-border pr-10 ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password ? (
                <p id="password-error" className="text-xs text-destructive pt-1">
                  {errors.password}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground pt-1">
                  Must be 8+ characters with uppercase, lowercase, number, and special character.
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold shadow-blue mt-2"
            >
              {authLoading ? "Creating account…" : <>Sign up <ArrowRight className="w-4 h-4 ml-1.5" /></>}
            </Button>
          </form>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-4">
            <GoogleAuthButtons mode="signup"/>
          </div>
          
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in
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