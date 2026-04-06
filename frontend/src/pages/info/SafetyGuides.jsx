import React from "react";
import InfoLayout from "./InfoLayout";

export default function SafetyGuides() {
  return (
    <InfoLayout title="Maritime Safety Guides" lastUpdated="April 5, 2026">
      <div className="space-y-12">
        <section>
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl mb-6">
             <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">Level 1: Immediate Hazards</h2>
             <p className="text-sm font-bold text-red-700">Immediate Action Required</p>
          </div>
          <p className="text-lg leading-relaxed text-slate-600">
            When you visualy identify an **Oil Spill** or an **Unidentified Vessel** near protected waters, 
            do not attempt to engage. Use the BlueShield app to snap a photo and submit a coordinate-tagged report 
            from a safe distance.
          </p>
        </section>

        <section>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl mb-6">
             <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight">Level 2: Weather & Debris</h2>
             <p className="text-sm font-bold text-blue-700">Advisory Action</p>
          </div>
          <p className="text-lg leading-relaxed text-slate-600">
            For Storm warnings or semi-submerged debris, tag the location and provide a short description. 
            This data is broadcasted to all vessels within a 50-mile radius via our **Sentinel Mesh** network.
          </p>
        </section>

        <section className="bg-slate-50 p-10 rounded-3xl border border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Best Practices for AIS Monitoring</h2>
          <ul className="list-disc pl-6 space-y-4 text-lg text-slate-600 font-medium leading-relaxed">
            <li>Keep your AIS transponder on at all times in Sector B.</li>
            <li>Monitor the BlueShield Real-time map once every 4 hours during transit.</li>
            <li>Verify Hazard reports from other vessels if you pass near the flagged location.</li>
            <li>Report equipment failures immediately in the "Maintenance" log.</li>
          </ul>
        </section>
      </div>
    </InfoLayout>
  );
}
