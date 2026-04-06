import React from "react";
import InfoLayout from "./InfoLayout";

export default function TermsOfService() {
  return (
    <InfoLayout title="Terms of Service" lastUpdated="April 5, 2026">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4">1. Acceptable Reporting</h2>
          <p className="text-lg leading-relaxed text-slate-600">
            Reports submitted through BlueShield must be **factual and verified**. Malicious reporting 
            or spamming of fake hazard alerts will result in immediate suspension of platform 
            access and may be reported to maritime authorities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4">2. Maritime Safety Compliance</h2>
          <p className="text-lg leading-relaxed text-slate-600">
            BlueShield is an **Advisory Platform**. While we provide real-time AIS and hazard data, 
            the final navigation decisions rest solely with the vessel captain. BlueShield 
            is not responsible for navigational accidents.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4">3. Platform Availability</h2>
          <p className="text-lg leading-relaxed text-slate-600">
            We strive for 99.9% uptime for our emergency broadcast systems. However, users 
            should maintain traditional UHF/VHF radio frequencies as a primary backup during 
            critical deep-sea operations.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
}
