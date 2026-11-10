import React from 'react';
import { Audit, ServiceQualityCard, CTQStatus } from '../types';
import {
  Award,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Quote,
  Sparkles,
} from 'lucide-react';

interface ServiceCardViewProps {
  audit: Audit;
  onBackToAudit?: () => void;
}

export const ServiceCardView: React.FC<ServiceCardViewProps> = ({ audit, onBackToAudit }) => {
  const card: ServiceQualityCard | undefined = audit.serviceCard;

  if (!card) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-purple-100 shadow-sm">
        <AlertCircle size={36} className="mx-auto text-amber-500 mb-3" />
        <h3 className="font-bold text-slate-800 text-base mb-1">Service Card Not Built Yet</h3>
        <p className="text-xs text-slate-500 mb-4">
          Complete at least 4 interview questions and click "Build Service Card" to generate this card.
        </p>
        {onBackToAudit && (
          <button
            onClick={onBackToAudit}
            className="px-4 py-2 bg-[#6D28D9] text-white text-xs font-semibold rounded-xl"
          >
            Go to Interview
          </button>
        )}
      </div>
    );
  }

  const getStatusBadge = (status: CTQStatus) => {
    switch (status) {
      case 'Met':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Met
          </span>
        );
      case 'At Risk':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            At Risk
          </span>
        );
      case 'Not Met':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Not Met
          </span>
        );
      case 'No data':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            No data
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Overview & Service Score Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
                DNSC Service Quality Card
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">
                {new Date(audit.completedAt || audit.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {card.serviceName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Evaluated for: {audit.profileSnapshot?.displayName || 'Employee'} ({audit.profileSnapshot?.roleCategory} · {audit.profileSnapshot?.office})
            </p>
          </div>

          {/* Service Score Ring / Badge */}
          <div className="flex items-center gap-3 bg-purple-50/80 border border-purple-100 p-4 rounded-2xl shrink-0">
            <Award size={32} className="text-[#6D28D9]" />
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                Service Score
              </span>
              <div className="text-2xl font-black text-[#6D28D9] tabular-nums">
                {typeof card.serviceScore === 'number' ? `${card.serviceScore}%` : 'N/A'}
              </div>
              <span className="text-[10px] text-slate-500">
                Measured CTQs Met
              </span>
            </div>
          </div>
        </div>

        {/* Requesters & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-[#0F766E]" />
              Primary Customers / Requesters
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {card.customers.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100/80"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-[#6D28D9]" />
              Audit Summary
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {card.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Voice of the Customer (VOC) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Quote size={18} className="text-[#6D28D9]" />
          Voice of the Customer (VOC) Analysis
        </h3>
        <p className="text-xs text-slate-500 leading-normal">
          Direct statements extracted from the interview mapped to the underlying stakeholder need.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {card.customerVoice.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 flex flex-col justify-between"
            >
              <div className="mb-3">
                <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide block mb-1">
                  Customer Need
                </span>
                <p className="text-sm font-bold text-slate-900 leading-snug">
                  {item.need}
                </p>
              </div>

              <blockquote className="text-xs italic text-slate-600 border-l-2 border-[#6D28D9] pl-3 py-0.5">
                "{item.quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </div>

      {/* The CTQ Tree: Drawn as Three Columns (Need -> Driver -> CTQ) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-[#0F766E]" />
              Critical-to-Quality (CTQ) Tree
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Three-tier translation from Customer Need to Process Driver to Measurable CTQ benchmark.
            </p>
          </div>
        </div>

        {/* Desktop 3-Column Visual Tree */}
        <div className="hidden lg:grid grid-cols-12 gap-3 bg-slate-50 p-3 rounded-2xl text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-200/60">
          <div className="col-span-3">1. Customer Need</div>
          <div className="col-span-3">2. Process Driver</div>
          <div className="col-span-6">3. Measurable CTQ & Standards Benchmark</div>
        </div>

        <div className="space-y-4">
          {card.ctqs.map((ctq, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-200 transition-all shadow-xs"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Column 1: Need */}
                <div className="lg:col-span-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block lg:hidden mb-1">
                    Customer Need
                  </span>
                  <div className="text-xs font-semibold text-slate-800 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/60">
                    {ctq.need}
                  </div>
                </div>

                {/* Column 2: Driver */}
                <div className="lg:col-span-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block lg:hidden mb-1">
                    Process Driver
                  </span>
                  <div className="text-xs font-medium text-slate-700 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/60 flex items-center gap-1.5">
                    <ArrowRight size={14} className="text-teal-600 shrink-0 hidden lg:inline" />
                    <span>{ctq.driver}</span>
                  </div>
                </div>

                {/* Column 3: CTQ & Benchmark */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block lg:hidden mb-1">
                        Critical-to-Quality Metric
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {ctq.ctq}
                      </h4>
                    </div>
                    {getStatusBadge(ctq.status)}
                  </div>

                  {/* Metrics strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Standard</span>
                      <span className="font-mono font-bold text-purple-700">
                        {ctq.code !== 'None' ? ctq.code : 'No code'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Target</span>
                      <span className="font-semibold text-slate-800">
                        {ctq.targetValue !== null ? `${ctq.targetValue} ${ctq.unit}` : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Reported</span>
                      <span className="font-semibold text-slate-800">
                        {ctq.reportedValue !== null ? `${ctq.reportedValue} ${ctq.unit}` : 'Not stated'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Variance / Gap</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          ctq.gap !== null && ctq.gap > 0
                            ? 'text-rose-600'
                            : ctq.gap !== null && ctq.gap <= 0
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {ctq.gap !== null
                          ? `${ctq.gap > 0 ? '+' : ''}${ctq.gap} ${ctq.unit} (${ctq.gapPercent}%)`
                          : 'No data'}
                      </span>
                    </div>
                  </div>

                  {/* Delay Cause & Quote */}
                  {ctq.delayCause && (
                    <div className="text-xs text-slate-600 flex items-start gap-2 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                      <Clock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-amber-900">Delay Bottleneck:</strong> {ctq.delayCause}
                      </span>
                    </div>
                  )}

                  {ctq.evidenceQuote && (
                    <p className="text-[11px] italic text-slate-500">
                      Evidence: "{ctq.evidenceQuote}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement Actions & Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Improvement Actions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#6D28D9]" />
            Actionable Improvements
          </h3>

          <div className="space-y-3">
            {card.improvements.map((imp, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">{imp.action}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                    {imp.code}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  <strong>Owner:</strong> {imp.owner} · <strong>Measure:</strong> {imp.measure}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observed Strengths */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#0F766E]" />
            Working Strengths
          </h3>

          {card.strengths.length > 0 ? (
            <ul className="space-y-2.5 text-xs text-slate-700">
              {card.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2 p-3 rounded-xl bg-teal-50/50 border border-teal-100">
                  <CheckCircle2 size={16} className="text-[#0F766E] shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No specific frontline strengths highlighted during this interview.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
