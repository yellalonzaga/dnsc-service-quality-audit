import React from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Audit } from '../types';
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface HomeViewProps {
  user: User;
  profile: UserProfile | null;
  latestAudit: Audit | null;
  onStartInterview: () => void;
  onViewAudit: (audit: Audit) => void;
  onOpenProfile: () => void;
  isStartingAudit: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  profile,
  latestAudit,
  onStartInterview,
  onViewAudit,
  onOpenProfile,
  isStartingAudit,
}) => {
  const firstName =
    profile?.displayName?.split(' ')[0] ||
    user.displayName?.split(' ')[0] ||
    'Colleague';

  const isProfileComplete = !!profile?.office && !!profile?.position && !!profile?.jobDescription;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Incomplete profile warning banner */}
      {!isProfileComplete && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>
              Please complete your office and role profile so the AI Audit Guide can reference the relevant DNSC standards.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            className="px-3 py-1.5 bg-amber-200/70 hover:bg-amber-200 font-semibold text-amber-950 rounded-lg shrink-0 cursor-pointer transition-colors"
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* 2-Column Hero layout on 1024px+ screens (Greeting Card + 4-Stage Methodology Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Welcome Greeting Banner */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-purple-50/30 to-teal-50/30 border border-purple-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#6D28D9]">
              <Sparkles size={16} />
              <span>Total Quality Management System</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Good day, {firstName}!
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xl mb-6">
              Welcome to the DNSC Service Quality Audit. Share your frontline experience in delivering campus services. Through a short Voice of the Customer (VOC) interview, we evaluate response times and benchmark delivery against college standards.
            </p>
          </div>

          <div className="relative z-10 pt-2">
            {/* Large Start Service Interview Button */}
            <button
              type="button"
              onClick={onStartInterview}
              disabled={isStartingAudit}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#6D28D9] to-[#5b21b6] hover:from-[#5b21b6] hover:to-[#4c1d95] text-white font-semibold text-sm shadow-md shadow-purple-900/10 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {isStartingAudit ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Start Service Interview</span>
                  <ArrowRight size={18} className="text-purple-200" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4-Stage TQM Methodology Explainer */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-[#0F766E]" />
              4-Stage Voice of the Customer (VOC) Methodology
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6D28D9] font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Service & Customers</h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Identify the primary service provided, requester channels, and process steps.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6D28D9] font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Voice of the Customer</h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Capture direct quotes, common complaints, and what excellence looks like.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6D28D9] font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Time & Delays</h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Estimate real turnaround times and pinpoint workflow friction and bottlenecks.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6D28D9] font-bold flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Improvements & Standards</h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Discuss actionable adjustments aligned with DNSC published standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Audit Card (if any) */}
      {latestAudit && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Latest Audit Session
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {latestAudit.serviceCard?.serviceName || 'In-Progress Service Audit'}
              </h3>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                latestAudit.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {latestAudit.status === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 block text-[11px] mb-0.5">Date</span>
              <span className="font-semibold text-slate-700">
                {new Date(latestAudit.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 block text-[11px] mb-0.5">Stage</span>
              <span className="font-semibold text-slate-700">
                Stage {latestAudit.stage} of 4
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 block text-[11px] mb-0.5">Answers</span>
              <span className="font-semibold text-slate-700">
                {latestAudit.answerCount} of 8 Questions
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-slate-400 block text-[11px] mb-0.5">Service Score</span>
              <span className="font-semibold text-[#0F766E]">
                {typeof latestAudit.serviceCard?.serviceScore === 'number'
                  ? `${latestAudit.serviceCard.serviceScore}% Met`
                  : 'Pending Card'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewAudit(latestAudit)}
            className="w-full py-2.5 px-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-[#6D28D9] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {latestAudit.status === 'completed' ? (
              <>
                <FileCheck size={16} />
                <span>View Service Quality Card & Transcript</span>
              </>
            ) : (
              <>
                <Clock size={16} />
                <span>Resume Interview</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
