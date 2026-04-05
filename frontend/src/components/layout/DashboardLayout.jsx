import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Fixed to the left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <Navbar />

        {/* Scrollable Page Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Outlet is where the nested routes (the actual dashboard pages) will be rendered */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
