import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, MessageCircle } from "lucide-react";

export default function InfoLayout({ title, lastUpdated, children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-sans text-slate-800 selection:bg-blue-100">
      {/* 1. Header (Static Reader Header) */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md py-4">
        <div className="mx-auto max-w-4xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="p-2 hover:bg-slate-100 rounded-full transition group"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="BlueShield Logo" className="h-6 w-6 rounded shadow-sm" />
              <span className="font-bold text-slate-900 tracking-tight">BlueShield Support</span>
            </div>
          </div>
          <Link to="/register" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition">
            Join the Platform
          </Link>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-24">
        {/* Page Header */}
        <div className="mb-12 border-b border-slate-200 pb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-400">
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span className="text-blue-500">Official Document</span>
          </div>
        </div>

        {/* Dynamic Content (Children) */}
        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-black prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-slate-900">
          {children}
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 p-10 bg-slate-900 rounded-3xl text-center relative overflow-hidden group">
           <div className="absolute top-0 left-1/4 w-64 h-full bg-blue-500/10 blur-3xl pointer-events-none" />
           <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Have questions about our terms?</h3>
           <p className="text-slate-400 mb-8 max-w-md mx-auto relative z-10 leading-relaxed">
             Our team is available 24/7 to clarify any maritime safety or legal protocols.
           </p>
           <a 
             href="https://wa.me/94711234567" 
             target="_blank" 
             rel="noopener noreferrer"
             className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform relative z-10 shadow-xl"
           >
             <MessageCircle className="w-5 h-5" /> Chat with Engineering Unit
           </a>
        </div>
      </main>

      {/* 3. Small Footer */}
      <footer className="border-t border-slate-100 py-12 bg-white">
        <div className="mx-auto max-w-4xl px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <Shield className="w-4 h-4" />
             <span>BlueShield Marine Protection Platform</span>
           </div>
           <div className="flex gap-8">
             <Link to="/privacy" className="hover:text-blue-600 transition">Privacy</Link>
             <Link to="/terms" className="hover:text-blue-600 transition">Terms</Link>
             <Link to="/safety" className="hover:text-blue-600 transition">Contact</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
