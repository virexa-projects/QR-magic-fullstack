"use client";
import { QrCode, Send, MessageCircle, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-blue flex items-center justify-center shadow-blue">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold font-heading text-foreground">QRBharat</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              India's smartest QR code platform. UPI, WhatsApp, Wi-Fi & dynamic QRs with real-time analytics — built for Bharat.
            </p>
            <div className="flex gap-3 mt-5">
              {[Send, MessageCircle, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition flex items-center justify-center text-muted-foreground">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#generator" className="hover:text-foreground">Generator</a></li>
              <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} QRBharat · Made with ❤️ in Coimbatore, India 🇮🇳</span>

          <span>Powered by <a href="https://virexa.in/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Virexa Technologies Private Limited</a></span>  
            </div>
      </div>
    </footer>
  );
}
