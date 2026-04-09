import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Sidebar - Fixed on desktop, Drawer on mobile */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Scrollable Page Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Outlet is where the nested routes will be rendered */}
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
