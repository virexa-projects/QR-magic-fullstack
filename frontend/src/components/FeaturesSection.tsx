"use client";
import { motion } from "framer-motion";
import { CreditCard, MessageSquare, Wifi, BarChart3, Palette, Download, ShieldCheck, Edit3 } from "lucide-react";

const features = [
  { icon: CreditCard, title: "UPI Payment QR", description: "Accept payments instantly via GPay, PhonePe, Paytm. Pre-fill amount + note." },
  { icon: MessageSquare, title: "WhatsApp QR", description: "Customers DM you with one scan. Pre-filled message included." },
  { icon: Wifi, title: "Wi-Fi Sharing", description: "Share Wi-Fi without typing passwords. Perfect for cafes & offices." },
  { icon: Edit3, title: "Dynamic QR Codes", description: "Edit destination URL anytime — even after you've printed the QR." },
  { icon: BarChart3, title: "Real-time Analytics", description: "Track scans, locations, devices and time-of-day trends." },
  { icon: Palette, title: "Brand Customization", description: "Custom colors, logos, frames. Match your brand identity perfectly." },
  { icon: ShieldCheck, title: "High Scanability", description: "Level H error correction — works even if 30% of QR is damaged." },
  { icon: Download, title: "Multi-format Export", description: "Download as PNG, SVG or PDF. Print-ready resolution." },
];

const stats = [
  { number: "50,000+", label: "Businesses trust us" },
  { number: "2.4M+", label: "QR codes generated" },
  { number: "4.9/5", label: "Avg user rating" },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-end mb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-4">
              FEATURES
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-foreground leading-tight">
              Unlock the Power of <span className="text-primary">Smart QRs</span>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-muted-foreground text-base md:text-lg">
            Everything you need to create, share, customize and track QR codes — built for Indian businesses, from kirana stores to enterprises.
          </motion.p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-14">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl p-5 md:p-7 border border-border/60 shadow-card text-center md:text-left"
            >
              <div className="text-2xl md:text-4xl font-bold font-heading text-primary">{s.number}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-2xl p-6 border border-border/60 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <f.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-base font-semibold font-heading text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
