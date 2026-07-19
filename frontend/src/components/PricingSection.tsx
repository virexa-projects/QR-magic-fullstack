"use client";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for personal use & trying it out",
    features: [
      "Unlimited static QR codes",
      "All QR types (UPI, WhatsApp, Wi-Fi)",
      "PNG & SVG downloads",
      "Basic color customization",
      "5 dynamic QRs",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹299",
    period: "/month",
    description: "For small businesses & creators",
    features: [
      "Everything in Free, plus:",
      "Unlimited dynamic QR codes",
      "Real-time scan analytics",
      "Logo & brand customization",
      "Bulk QR generation (CSV)",
      "Priority email support",
    ],
    cta: "Start 14-day trial",
    popular: true,
  },
  {
    name: "Business",
    price: "₹999",
    period: "/month",
    description: "For teams & growing brands",
    features: [
      "Everything in Pro, plus:",
      "Team collaboration (5 members)",
      "Advanced analytics & exports",
      "Custom domain (qr.yourbrand.in)",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Start 14-day trial",
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-soft">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-4">
            PRICING
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-foreground leading-tight">
            Simple pricing for <span className="text-primary">every business</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Start free. Upgrade when you grow. No hidden fees, cancel anytime. Prices in INR (incl. GST).
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-3xl p-7 border ${
                tier.popular
                  ? "bg-gradient-blue text-primary-foreground border-primary shadow-blue scale-[1.02]"
                  : "bg-card border-border/60 shadow-card"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-warning text-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}
              <div className={`text-sm font-semibold ${tier.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {tier.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-4xl md:text-5xl font-bold font-heading ${tier.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {tier.price}
                </span>
                <span className={`text-sm ${tier.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {tier.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${tier.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {tier.description}
              </p>

              <Button
                asChild
                className={`w-full mt-6 rounded-full h-11 font-semibold ${
                  tier.popular
                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Link href="/login">{tier.cta}</Link>
              </Button>

              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.popular ? "text-primary-foreground" : "text-primary"}`} />
                    <span className={tier.popular ? "text-primary-foreground/95" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          All plans include 99.9% uptime SLA · GDPR & DPDP Act compliant · Hosted in Mumbai
        </p>
      </div>
    </section>
  );
}
