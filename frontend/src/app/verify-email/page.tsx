"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, MailCheck, MailWarning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { verifyEmail, resendVerification, fetchCurrentUser } from "@/store/slices/authSlice";

function VerifyEmailInner() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { resendingVerification } = useAppSelector((s) => s.auth);

  const token = params.get("token");
  const emailFromLink = params.get("email");

  const sessionEmail = useAppSelector((s) => s.auth.user?.email);
  const email = emailFromLink || sessionEmail || "";

  const [status, setStatus] = useState<"pending-click" | "verifying" | "success" | "error">(
    token ? "verifying" : "pending-click"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || !emailFromLink) return;

    dispatch(verifyEmail({ email: emailFromLink, token }))
      .unwrap()
      .then(() => {
        setStatus("success");
        // Force a fresh /auth/me fetch regardless of whether the local
        // patch in the reducer applied. This is what actually fixes the
        // "verified but bounced back to /verify-email" loop — any route
        // guard reading `user.isVerified` from the store now sees the
        // real, current value instead of a possibly-stale one.
        dispatch(fetchCurrentUser());
      })
      .catch((err: string) => {
        setErrorMessage(err || "This verification link is invalid or has expired.");
        setStatus("error");
      });
  }, [token, emailFromLink, dispatch]);

  const handleResend = () => {
    if (!email) return;
    dispatch(resendVerification(email));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-blue flex items-center justify-center shadow-blue">
          <QrCode className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold font-heading text-foreground">QRBharat</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        {status === "verifying" && (
          <>
            <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold font-heading text-foreground">Verifying your email…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Just a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 grid place-items-center mx-auto mb-4">
              <MailCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground">Email verified!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is fully activated. You're all set.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-11 mt-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold"
            >
              Go to dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-destructive/10 grid place-items-center mx-auto mb-4">
              <MailWarning className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground">Verification failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            {email && (
              <Button
                onClick={handleResend}
                disabled={resendingVerification}
                variant="outline"
                className="w-full h-11 mt-6 rounded-xl font-semibold"
              >
                {resendingVerification ? "Sending…" : "Send a new link"}
              </Button>
            )}
          </>
        )}

        {status === "pending-click" && (
          <>
            <div className="w-14 h-14 rounded-full bg-primary/10 grid place-items-center mx-auto mb-4">
              <MailCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a verification link to{" "}
              {email ? <span className="font-medium text-foreground">{email}</span> : "your email address"}.
              Click it to activate your account.
            </p>
            {email && (
              <Button
                onClick={handleResend}
                disabled={resendingVerification}
                variant="outline"
                className="w-full h-11 mt-6 rounded-xl font-semibold"
              >
                {resendingVerification ? "Sending…" : "Resend email"}
              </Button>
            )}
            <p className="mt-6 text-xs text-muted-foreground">
              Wrong email?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Sign up again
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}