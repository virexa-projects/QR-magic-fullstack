import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import StyledQrPreview from "./dashboard/StyledQrPreview";
import type { QRDesign } from "@/lib/mockData";

// Static — this QR never changes, so define it once outside the component
// instead of rebuilding the object on every render.
const HERO_QR_DESIGN: QRDesign = {
  fgColor: "#000099",
  bgColor: "#FFFFFF",
  eyeColor: "#000099",
  dotStyle: "square",
  frame: "none",
  errorCorrectionLevel: "H",
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 bg-hero">
      {/* soft blue blobs */}
      <div className="absolute top-20 -left-32 w-[420px] h-[420px] bg-primary/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 -right-32 w-[420px] h-[420px] bg-primary-glow/15 rounded-full blur-[140px]" />

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft border border-primary/15 text-primary text-xs font-semibold mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            India's #1 Smart QR Code Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading text-foreground leading-[1.05] max-w-4xl"
          >
            Elevate Your Business with{" "}
            <span className="text-gradient-primary">Smart QR Codes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            Create UPI, WhatsApp, Wi-Fi & dynamic QR codes that you can edit anytime.
            Built for Indian businesses — with real-time scan analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-7 h-12 shadow-blue font-semibold">
              <Link href="/login">
                Start now — It's Free
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7 h-12 border-border bg-card hover:bg-secondary">
              <a href="#generator">Try generator</a>
            </Button>
          </motion.div>

          {/* Floating cards mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-14 md:mt-20 relative w-full max-w-5xl"
          >
            <div className="relative bg-gradient-blue rounded-3xl p-8 md:p-14 shadow-elevated overflow-hidden">
              <div className="absolute inset-0 grid-pattern opacity-[0.06]" />

              {/* Center QR card */}
              <div className="relative flex items-center justify-center gap-4 md:gap-6">
                {/* Left card - Analytics */}
                <motion.div
                  initial={{ opacity: 0, x: -20, rotate: -6 }}
                  animate={{ opacity: 1, x: 0, rotate: -4 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="hidden md:block bg-card rounded-2xl p-4 shadow-elevated w-52"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Today's Scans</span>
                    <span className="text-xs font-semibold text-success">+18%</span>
                  </div>
                  <div className="text-2xl font-bold font-heading text-foreground">2,847</div>
                  <div className="mt-3 h-12 flex items-end gap-1">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/80 rounded-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </motion.div>

                {/* Center QR */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="bg-card rounded-2xl p-5 md:p-6 shadow-elevated"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Live QR</span>
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold">●  ACTIVE</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl">
                    <StyledQrPreview value="https://qrbharat.in" design={HERO_QR_DESIGN} size={140} />
                  </div>
                  <p className="mt-3 text-xs font-medium text-foreground text-center">qrbharat.in</p>
                </motion.div>

                {/* Right card - UPI */}
                <motion.div
                  initial={{ opacity: 0, x: 20, rotate: 6 }}
                  animate={{ opacity: 1, x: 0, rotate: 4 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="hidden md:block bg-card rounded-2xl p-4 shadow-elevated w-52"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-primary font-bold text-xs">₹</div>
                    <span className="text-xs font-semibold text-foreground">UPI Payment</span>
                  </div>
                  <div className="text-2xl font-bold font-heading text-foreground">₹ 1,250</div>
                  <p className="text-xs text-muted-foreground mt-1">store@hdfcbank</p>
                  <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 grid grid-cols-3 gap-4 md:gap-12 max-w-3xl w-full"
          >
            {[
              { icon: Zap, label: "Instant", sub: "Generate in <1s" },
              { icon: ShieldCheck, label: "Secure", sub: "256-bit encrypted" },
              { icon: BarChart3, label: "Analytics", sub: "Real-time scans" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}