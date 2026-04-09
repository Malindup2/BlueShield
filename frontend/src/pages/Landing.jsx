import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import HomeMap from "../components/HomeMap";
import { Shield, Brain, AlertTriangle, ArrowRight, MapPin, ChevronRight, MessageCircle, Github, Twitter, Linkedin, Globe, Mail, ExternalLink, Menu, X } from "lucide-react";

const ALERTS = [
  { id: 1, type: "CRITICAL", text: "Storm Approaching: Zone B (High Risk)", color: "red" },
  { id: 2, type: "WARNING", text: "Unidentified Vessel detected near Kalpitiya", color: "amber" },
  { id: 3, type: "NOTICE", text: "Oil Spill detected in Sector 4", color: "amber" },
];

export default function Landing() {
  const [alertIndex, setAlertIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % ALERTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-x-hidden">
      {/* Inline styles for custom marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-marquee {
          white-space: nowrap;
          animation: marquee 30s linear infinite;
          display: inline-flex;
          min-width: max-content;
        }
        .animate-blink {
          animation: blink 1s border-color infinite;
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>

      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="BlueShield Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold tracking-tight text-[#0f172a]">BlueShield</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a className="hover:text-blue-600 transition-colors" href="#">Home</a>
            <a className="hover:text-blue-600 transition-colors" href="#map">Safety Alerts</a>
            <a className="hover:text-blue-600 transition-colors" href="#framework">About Us</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden text-sm font-bold text-slate-700 hover:text-blue-600 md:inline-flex transition-colors">
              Login
            </Link>
            <Link to="/register" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition">
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3">
            <nav className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              <a onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100" href="#">Home</a>
              <a onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100" href="#map">Safety Alerts</a>
              <a onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100" href="#framework">About Us</a>
              <Link onClick={() => setMobileMenuOpen(false)} to="/login" className="px-3 py-2 rounded-lg hover:bg-slate-100">Login</Link>
            </nav>
          </div>
        )}
      </header>

      {/* 2. Marquee Ticker (Directly after Header) */}
      <div className="bg-[#0f172a] border-y border-slate-800 text-white py-3 overflow-x-hidden shadow-inner flex whitespace-nowrap">
        <div className="animate-marquee gap-12 font-medium text-sm tracking-widest uppercase text-blue-400 items-center">
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> LIVE: 12.5k VESSELS TRACKED</span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> HAZARD ALERT: GALE WARNING IN NORTHERN SECTOR</span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> NEW: REPORT ANONYMOUSLY VIA SECURE APP</span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> LIVE: 12.5k VESSELS TRACKED</span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> HAZARD ALERT: GALE WARNING IN NORTHERN SECTOR</span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> NEW: REPORT ANONYMOUSLY VIA SECURE APP</span>
          <span className="text-slate-700">|</span>
        </div>
      </div>

      {/* 3. Hero Section (Video Background) */}
      <section className="relative h-[460px] md:h-[500px] w-full overflow-hidden bg-slate-900 border-b border-slate-800">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Blue Shield
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl font-medium drop-shadow-md">
            Protecting oceans and empowering maritime communities through intelligent threat detection and unified reporting.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition transform hover:-translate-y-0.5">
              Secure the Seas
            </Link>
            <a href="#framework" className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 text-base font-bold text-white hover:bg-white/20 transition">
              Explore Sentinel
            </a>
          </div>
        </div>
      </section>

      {/* 4. Critical Alerts Bar (Vertical Cycling - Enhanced Height & Indicators) */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border-y border-red-900/50 py-4 overflow-hidden shadow-2xl relative h-[80px] flex items-center">
        <div className="absolute top-0 left-1/4 w-96 h-full bg-red-600/10 blur-3xl pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 flex items-center gap-8 w-full">
          <div className="flex items-center gap-3 bg-red-600 text-white px-5 py-2 rounded-md font-black tracking-widest text-xs whitespace-nowrap shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            LIVE ALERTS
          </div>

          <div className="relative flex-1 h-10 overflow-hidden">
            {ALERTS.map((alert, idx) => (
              <div 
                key={alert.id}
                className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
                  idx === alertIndex 
                    ? "opacity-100 translate-y-0 pointer-events-auto" 
                    : "opacity-0 translate-y-10 pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-1.5 rounded-lg ${alert.color === 'red' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    <AlertTriangle className={`w-5 h-5 ${alert.color === 'red' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                  </div>
                  <span className={`text-base md:text-lg font-bold uppercase tracking-tight ${alert.color === 'red' ? 'text-white' : 'text-slate-200'}`}>
                    {alert.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            {ALERTS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === alertIndex 
                    ? "bg-red-500 w-12 shadow-[0_0_10px_rgba(239,68,68,0.6)]" 
                    : "bg-white/10 w-6"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5. Live Map Section */}
      <section id="map" className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            Live Maritime Monitoring
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto font-medium">
            Global overview of active vessels, verified hazard reports, and protected marine perimeters.
          </p>
          
          <div className="mt-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 h-[500px] w-full relative group">
            {/* Overlay to encourage login, optional but good for marketing */}
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center pointer-events-none">
              <span className="bg-white px-6 py-3 rounded-full font-bold shadow-lg text-blue-600">
                Sign in to view real-time data
              </span>
            </div>
            <HomeMap />
          </div>
        </div>
      </section>

      {/* 6. Stats Section (Moved after Map) */}
      <section className="bg-[#031d41] py-20 px-4 md:px-8 border-t-8 border-blue-600">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6 text-center">
          <div>
            <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">450k+</div>
            <div className="mt-4 text-xs font-bold text-[#60a5fa] tracking-[0.2em] uppercase">Reports Verified</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">1.2m</div>
            <div className="mt-4 text-xs font-bold text-[#60a5fa] tracking-[0.2em] uppercase">Sq Miles Protected</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">12.5k</div>
            <div className="mt-4 text-xs font-bold text-[#60a5fa] tracking-[0.2em] uppercase">Active Vessels</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">99.9%</div>
            <div className="mt-4 text-xs font-bold text-[#60a5fa] tracking-[0.2em] uppercase">System Uptime</div>
          </div>
        </div>
      </section>

      {/* 7. The Sentinel Framework (How it Works) */}
      <section id="framework" className="py-16 md:py-24 bg-[#f8f9fc]">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-5xl">
              The Sentinel Framework
            </h2>
            <div className="h-1 w-24 bg-[#f97316] mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
            {/* Card 1: Secure Incident Reporting (2/3 width on desktop) */}
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200 md:col-span-2 flex flex-col justify-between hover:shadow-md transition group">
              <div>
                <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center mb-8">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-[#0f172a] tracking-tight">Secure Incident Reporting</h3>
                <p className="mt-4 text-slate-600 text-lg leading-relaxed max-w-xl">
                  Encrypted, anonymous reporting channels for maritime workers to highlight safety violations and hazards without fear of reprisal.
                </p>
              </div>
              <div>
                <a href="#" className="inline-flex items-center text-sm font-bold text-[#0f172a] hover:text-blue-600 transition">
                  Learn about data privacy <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Card 2: Real-time Vessel Tracking (1/3 width on desktop) */}
            <div className="relative rounded-3xl overflow-hidden shadow-sm md:col-span-1 flex flex-col justify-end p-8 group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ 
                  backgroundImage: "url('/coast-guard-poster.jpg')",
                  backgroundPosition: "center 20%" 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001736] via-[#001736]/60 to-transparent" />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white tracking-tight">Real-time Vessel Tracking</h3>
                <MapPin className="mt-4 w-6 h-6 text-white" />
              </div>
            </div>

            {/* Card 3: AI-Powered Risk Assessment (1/3 width on desktop) */}
            <div className="bg-[#0b1b36] rounded-3xl p-10 shadow-sm md:col-span-1 flex flex-col justify-center relative overflow-hidden group">
              {/* Abstract decorative shape */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-8 border border-white/10">
                  <Brain className="w-6 h-6 text-[#93c5fd]" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">AI-Powered Risk Assessment</h3>
                <p className="mt-4 text-[#93c5fd] font-medium text-sm leading-relaxed">
                  Automated analysis of patterns to predict and prevent maritime accidents before they occur.
                </p>
              </div>
            </div>

            {/* Card 4: Marine Hazard Alerts (2/3 width on desktop) */}
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200 md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-md transition">
              <div className="flex-1">
                <span className="inline-block px-3 py-1 bg-[#ffedd5] text-[#c2410c] text-xs font-black uppercase tracking-wider rounded">
                  Live Alerts
                </span>
                <h3 className="mt-6 text-3xl font-bold text-[#0f172a] tracking-tight">Marine Hazard Alerts</h3>
                <p className="mt-4 text-slate-600 text-lg leading-relaxed max-w-md">
                  Immediate broadcasting of weather events, debris tracking, and navigational hazards to all active fleet members.
                </p>
              </div>
              <div className="w-full md:w-64 h-48 bg-[#f1f5f9] rounded-2xl flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-20 h-20 text-[#f97316]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Enhanced Footer (UI/UX Revision) */}
      <footer className="bg-[#0f172a] text-slate-400 py-16 border-t border-slate-800 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -mb-32 -mr-32" />
        
        <div className="mx-auto max-w-7xl px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            {/* Brand Column */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="BlueShield Logo" className="h-10 w-10 brightness-110 rounded-xl shadow-lg border border-white/10" />
                <span className="text-2xl font-black tracking-tighter text-white">BlueShield</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Empowering maritime safety through real-time intelligence and decentralized incident reporting. Protecting our oceans, one ping at a time.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 transition group">
                  <Twitter className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 transition group">
                  <Linkedin className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
                </a>
              </div>
            </div>

            {/* Platform Column */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Platform</h4>
              <ul className="flex flex-col gap-4 text-sm font-medium">
                <li><Link to="/login" className="hover:text-blue-400 transition-colors flex items-center gap-2 group">Vessel Registry <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" /></Link></li>
                <li><a href="#map" className="hover:text-blue-400 transition-colors flex items-center gap-2 group">Incident Map <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" /></a></li>
                <li><a href="#framework" className="hover:text-blue-400 transition-colors">Alert Protocol</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">API Documentation</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Resources</h4>
              <ul className="flex flex-col gap-4 text-sm font-medium">
                <li><Link to="/safety" className="hover:text-blue-400 transition-colors">Safety Guides</Link></li>
                <li><Link to="/safety" className="hover:text-blue-400 transition-colors">Marine Hazards 101</Link></li>
                <li><a href="mailto:support@blueshield.maritime" className="hover:text-blue-400 transition-colors">Report a Bug</a></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Legal Hub</Link></li>
              </ul>
            </div>

            {/* Contact/Support Column */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Operational Support</h4>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">24/7 Response Unit</p>
                    <p className="text-sm font-bold text-white">ops@blueshield.maritime</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">System Status</p>
                    <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> All Systems Online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full mb-8" />

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-600" />
              <span>BlueShield Marine Protection Platform</span>
            </div>
            <div className="flex gap-8 text-slate-500">
              <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition">Terms of Use</Link>
              <Link to="/privacy" className="hover:text-white transition">Security Audit</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a 
        href="https://wa.me/94711234567" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] group flex items-center gap-3"
      >
        <div className="bg-white px-4 py-2 rounded-full shadow-xl border border-slate-200 text-slate-700 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 pointer-events-none whitespace-nowrap">
          Chat with us
        </div>
        <div className="w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 group-relative">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white fill-white/20" />
        </div>
      </a>
    </div>
  );
}
