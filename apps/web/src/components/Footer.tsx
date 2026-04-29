"use client";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, Sparkles } from "lucide-react";

export default function Footer() {
  const { lang } = useLanguage();

  const LINKS_COL1 = [
    { href: "/",           label: t(lang, "navHome") },
    { href: "/recommend",  label: t(lang, "navAdvice") },
    { href: "/crops",      label: t(lang, "navCrops") },
    { href: "/calculator", label: t(lang, "navCalc") },
  ];

  const LINKS_COL2 = [
    { href: "/weather",    label: t(lang, "navWeather") },
    { href: "/mandi",      label: t(lang, "navMandi") },
    { href: "/yojana",     label: t(lang, "navYojana") },
    { href: "/calendar",   label: t(lang, "navCalendar") },
    { href: "/diseases",   label: t(lang, "navDiseases") },
  ];

  return (
    <footer className="bg-emerald-950 text-emerald-50/80 pt-16 pb-24 sm:pb-12 border-t border-white/5 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="mx-auto max-w-6xl px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/10">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain invert brightness-0" />
              </div>
              <div>
                <span className="block font-black text-white text-xl tracking-tight leading-none">KrishiConnect</span>
                <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest mt-1 block">Premium AI Advisor</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {lang === "hi" 
                ? "किसानों के लिए भारत का सबसे आधुनिक AI सलाहकार। बेहतर फसल, बेहतर कमाई।" 
                : "India's most advanced AI advisor for farmers. Better crops, better earnings."}
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 transition-all text-white/50 hover:text-white">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              {lang === "hi" ? "त्वरित लिंक" : "Quick Links"}
            </h4>
            <ul className="space-y-4">
              {LINKS_COL1.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {lang === "hi" ? "सेवाएं" : "Services"}
            </h4>
            <ul className="space-y-4">
              {LINKS_COL2.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {lang === "hi" ? "संपर्क" : "Contact"}
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm">
                <MapPin size={18} className="text-gold-500 shrink-0" />
                <span>New Delhi, India</span>
              </li>
              <li className="flex gap-3 text-sm">
                <Phone size={18} className="text-emerald-500 shrink-0" />
                <span>+91 1800-KRISHI-AI</span>
              </li>
              <li className="flex gap-3 text-sm">
                <Mail size={18} className="text-blue-400 shrink-0" />
                <span>support@KrishiConnect.ai</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs">
          <p>© 2026 KrishiConnect AI · {lang === "hi" ? "किसान की सेवा में समर्पित" : "Dedicated to serving farmers"}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
