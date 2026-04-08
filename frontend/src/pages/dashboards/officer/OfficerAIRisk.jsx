import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Activity, ArrowRight, Bot, BrainCircuit, ChevronDown, FileWarning, Search, Shield } from "lucide-react";

import { Skeleton } from "../../../components/common/Skeleton";
import { getEnforcements, getEnforcementById, generateRiskScore } from "../../../services/enforcementAPI";

export default function OfficerAIRisk() {
  const [enforcements, setEnforcements] = useState([]);
  const [selectedEnforcement, setSelectedEnforcement] = useState("");
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCasePicker, setShowCasePicker] = useState(false);
  const casePickerRef = useRef(null);

  useEffect(() => {
    getEnforcements({ limit: 20 })
      .then(res => {
        const items = res.items || [];
        setEnforcements(items);
        if (items.length > 0) {
          setSelectedEnforcement(items[0]._id);
          const defaultLabel = items[0].relatedCase?.title
            ? `${items[0].relatedCase.title} (${items[0]._id.slice(-6).toUpperCase()})`
            : `INVESTIGATION: ${items[0]._id.slice(-6).toUpperCase()}`;
          setSearchQuery(defaultLabel);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!casePickerRef.current) return;
      if (!casePickerRef.current.contains(event.target)) {
        setShowCasePicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!selectedEnforcement) return;
    fetchCaseDetails();
  }, [selectedEnforcement]);

  const fetchCaseDetails = () => {
    setLoading(true);
    getEnforcementById(selectedEnforcement)
      .then(res => setActiveCase(res))
      .catch(err => console.error(err))
      .finally(() => setTimeout(() => setLoading(false), 800));
  };

  const handleGenerateRisk = async () => {
    if (!selectedEnforcement) return;
    setGenerating(true);
    try {
      await generateRiskScore(selectedEnforcement);
      fetchCaseDetails(); // Refresh to pull new AI score
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("Failed to generate AI Risk Score. Ensure Gemini API key is configured.");
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "CRITICAL": return "text-red-600";
      case "HIGH": return "text-orange-600";
      case "MODERATE": return "text-amber-600";
      default: return "text-emerald-600";
    }
  };

  const riskHistory = activeCase?.riskScoreHistory || [];
  const currentAssessment = riskHistory[riskHistory.length - 1];

  const filteredEnforcements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return enforcements;
    return enforcements.filter((enf) => {
      const id = enf._id.toLowerCase();
      const title = (enf.relatedCase?.title || "").toLowerCase();
      const status = (enf.status || "").toLowerCase();
      return id.includes(query) || title.includes(query) || status.includes(query);
    });
  }, [enforcements, searchQuery]);

  const handleCaseSelect = (caseId) => {
    const selected = enforcements.find((enf) => enf._id === caseId);
    if (!selected) return;
    setSelectedEnforcement(caseId);
    const label = selected.relatedCase?.title
      ? `${selected.relatedCase.title} (${selected._id.slice(-6).toUpperCase()})`
      : `INVESTIGATION: ${selected._id.slice(-6).toUpperCase()}`;
    setSearchQuery(label);
    setShowCasePicker(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <BrainCircuit className="w-3 h-3" /> Gemini-Powered
              </div>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">AI Risk Analyzer</h2>
            <p className="text-slate-400 mt-2 font-medium max-w-xl">
              Leverage autonomous intelligence to evaluate case severity, legal exposure, and recommended operational responses.
            </p>
          </div>

          <div className="w-full md:w-[30rem]" ref={casePickerRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowCasePicker(true);
                }}
                onFocus={() => setShowCasePicker(true)}
                placeholder="Search case ID, title, or status..."
                className="w-full bg-slate-900 border border-slate-700 text-white py-2.5 pl-9 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-[11px] placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowCasePicker((prev) => !prev)}
                className="absolute right-2 top-1.5 p-2 rounded-md text-slate-400 hover:text-slate-300"
                title="Toggle case list"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {showCasePicker && (
                <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                  {filteredEnforcements.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">No cases found</div>
                  ) : (
                    filteredEnforcements.map((enf) => {
                      const label = enf.relatedCase?.title
                        ? `${enf.relatedCase.title} (${enf._id.slice(-6).toUpperCase()})`
                        : `INVESTIGATION: ${enf._id.slice(-6).toUpperCase()}`;

                      return (
                        <button
                          key={enf._id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleCaseSelect(enf._id)}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 border-slate-800 hover:bg-slate-800 transition ${
                            selectedEnforcement === enf._id ? "bg-slate-800" : ""
                          }`}
                        >
                          <div className="text-sm font-bold text-slate-100 truncate">{label}</div>
                          <div className="mt-1 text-[11px] text-slate-400">Status: {enf.status?.replaceAll("_", " ")}</div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <Skeleton variant="circular" width="192px" height="192px" className="mb-6" />
            <Skeleton width="60%" height="24px" className="mb-2" />
            <Skeleton width="40%" height="16px" className="mb-8" />
            <Skeleton width="100%" height="48px" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <Skeleton width="30%" height="20px" className="mb-4" />
              <Skeleton width="100%" height="80px" />
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <Skeleton width="30%" height="20px" className="mb-4" />
              <div className="space-y-4">
                <Skeleton width="100%" height="48px" />
                <Skeleton width="100%" height="48px" />
              </div>
            </div>
          </div>
        </div>
      ) : currentAssessment ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="relative w-48 h-48 flex items-center justify-center mb-6">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                 <circle 
                   cx="50" cy="50" r="45" 
                   fill="none" 
                   stroke="currentColor" 
                   strokeWidth="8"
                   strokeDasharray={`${currentAssessment.riskScore * 2.827} 282.7`}
                   className={`${getRiskColor(currentAssessment.riskLevel)} transition-all duration-1000 ease-out`}
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-5xl font-black text-slate-800">{currentAssessment.riskScore}</span>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
               </div>
             </div>
             
             <div className="space-y-1">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Calculated Risk Level</p>
               <h3 className={`text-2xl font-black uppercase tracking-tight ${getRiskColor(currentAssessment.riskLevel)}`}>
                 {currentAssessment.riskLevel}
               </h3>
             </div>

             <button 
               onClick={handleGenerateRisk}
               disabled={generating}
               className="mt-8 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
             >
               {generating ? (
                 <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
               ) : (
                 <><Activity className="w-4 h-4" /> Re-Assess Risk</>
               )}
             </button>
             <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-wider">
               Last run: {format(new Date(currentAssessment.assessedAt), "MMM d, HH:mm")}
             </p>
          </div>

          {/* Justification & Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4">
                <FileWarning className="w-5 h-5 text-blue-600" /> Legal Justification
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                {currentAssessment.justification || "No justification provided by the AI model."}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4">
                <Bot className="w-5 h-5 text-blue-600" /> Recommended Actions
              </h3>
              {currentAssessment.recommendedActions?.length > 0 ? (
                <ul className="space-y-4">
                  {currentAssessment.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="mt-0.5 bg-blue-100 p-1 rounded">
                        <ArrowRight className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{action}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 font-medium italic">No specific actions recommended.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
             <Bot className="w-10 h-10 text-blue-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">No Assessment Found</h3>
           <p className="text-slate-500 max-w-md mt-2 mb-8">
             This case has not been analyzed by the Sentinel AI yet. Generate a risk score to receive operational recommendations.
           </p>
           <button 
               onClick={handleGenerateRisk}
               disabled={generating}
               className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
             >
               {generating ? (
                 <div className="w-5 h-5 border-2 border-blue-400 border-t-white rounded-full animate-spin" />
               ) : (
                 <><Activity className="w-5 h-5" /> Initialize AI Analysis</>
               )}
           </button>
        </div>
      )}
    </div>
  );
}
