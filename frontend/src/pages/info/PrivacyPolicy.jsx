import React from "react";
import InfoLayout from "./InfoLayout";

export default function PrivacyPolicy() {
  return (
    <InfoLayout title="Privacy Policy" lastUpdated="April 5, 2026">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4">1. Data Sovereignty</h2>
          <p className="text-lg leading-relaxed text-slate-600">
            BlueShield is built on the principle of **Anonymous Reporting**. When you submit a maritime hazard, 
            your identity is cryptographically shielded. We do not store your personal GPS history beyond 
            active safety session tracking.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4">2. Real-time AIS Usage</h2>
          <p className="text-lg leading-relaxed text-slate-600">
            Our vessel tracking systems utilize public AIS data streams. While we monitor vessel positions for 
            safety, we do not store proprietary fishing routes or commercial transit patterns beyond 24 hours 
            unless flagged for a maritime violation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4">3. Information Sharing</h2>
          <p className="text-lg leading-relaxed text-slate-600">
            Critical hazard data (Oil Spills, Storms, Unidentified Vessels) is shared instantly with the 
            Coast Guard and active fleet members. Individual reporter metadata is **never** shared with 
            third-party commercial entities.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
}
