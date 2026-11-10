import React, { useState } from 'react';
import { Audit, CTQStatus, RoleCategory } from '../types';
import { ServiceCardView } from './ServiceCardView';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Filter,
  ArrowUpDown,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface ScorecardViewProps {
  allAudits: Audit[];
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({ allAudits }) => {
  const [selectedAuditForView, setSelectedAuditForView] = useState<Audit | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // a. Five figures: people interviewed, completed audits, CTQs measured, % of measured CTQs Met, CTQs Not Met.
  const uniqueUsers = new Set<string>();
  let completedAuditsCount = 0;
  const rawAllCtqs: any[] = [];

  for (const audit of allAudits) {
    if (audit.userId) uniqueUsers.add(audit.userId);
    if (audit.status === 'completed' && audit.serviceCard) {
      completedAuditsCount++;
      const card = audit.serviceCard;
      if (Array.isArray(card.ctqs)) {
        card.ctqs.forEach((c) => {
          rawAllCtqs.push({
            ...c,
            service: card.serviceName || 'General Service',
            roleCategory: audit.profileSnapshot?.roleCategory || 'Staff',
            date: audit.completedAt || audit.createdAt,
            parentAudit: audit,
          });
        });
      }
    }
  }

  const measuredCtqs = rawAllCtqs.filter((c) => c.status !== 'No data');
  const metCount = measuredCtqs.filter((c) => c.status === 'Met').length;
  const atRiskCount = measuredCtqs.filter((c) => c.status === 'At Risk').length;
  const notMetCount = measuredCtqs.filter((c) => c.status === 'Not Met').length;
  const percentMet = measuredCtqs.length > 0 ? Math.round((metCount / measuredCtqs.length) * 100) : 0;

  // b. Scorecard by standard: one row per standard code used, with number of CTQs, Met, At Risk, Not Met, No data, and average gap in %
  const standardStatsMap = new Map<
    string,
    { total: number; met: number; atRisk: number; notMet: number; noData: number; totalGapPct: number; gapCount: number }
  >();

  for (const ctq of rawAllCtqs) {
    const code = ctq.code || 'None';
    if (!standardStatsMap.has(code)) {
      standardStatsMap.set(code, { total: 0, met: 0, atRisk: 0, notMet: 0, noData: 0, totalGapPct: 0, gapCount: 0 });
    }
    const row = standardStatsMap.get(code)!;
    row.total++;
    if (ctq.status === 'Met') row.met++;
    else if (ctq.status === 'At Risk') row.atRisk++;
    else if (ctq.status === 'Not Met') row.notMet++;
    else row.noData++;

    if (typeof ctq.gapPercent === 'number') {
      row.totalGapPct += ctq.gapPercent;
      row.gapCount++;
    }
  }

  const standardScorecardRows: any[] = [];
  for (const [code, stat] of standardStatsMap.entries()) {
    standardScorecardRows.push({
      code,
      total: stat.total,
      met: stat.met,
      atRisk: stat.atRisk,
      notMet: stat.notMet,
      noData: stat.noData,
      avgGap: stat.gapCount > 0 ? Math.round(stat.totalGapPct / stat.gapCount) : 0,
    });
  }
  standardScorecardRows.sort((a, b) => b.total - a.total);

  // c. All CTQs: sorted Not Met, At Risk, Met, No data, then by gap % (largest first); filters for status and role category
  const statusWeight: Record<string, number> = {
    'Not Met': 1,
    'At Risk': 2,
    Met: 3,
    'No data': 4,
  };

  const filteredCtqs = rawAllCtqs.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (roleFilter !== 'all' && item.roleCategory !== roleFilter) return false;
    return true;
  });

  filteredCtqs.sort((a, b) => {
    const weightDiff = (statusWeight[a.status] || 5) - (statusWeight[b.status] || 5);
    if (weightDiff !== 0) return weightDiff;
    const gapA = typeof a.gapPercent === 'number' ? a.gapPercent : -9999;
    const gapB = typeof b.gapPercent === 'number' ? b.gapPercent : -9999;
    return gapB - gapA; // largest gap first
  });

  const getStatusChip = (status: CTQStatus) => {
    switch (status) {
      case 'Met':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Met</span>;
      case 'At Risk':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">At Risk</span>;
      case 'Not Met':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Not Met</span>;
      case 'No data':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">No data</span>;
    }
  };

  if (selectedAuditForView) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => setSelectedAuditForView(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6D28D9] hover:underline cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Institutional CTQ Scorecard</span>
        </button>

        <ServiceCardView audit={selectedAuditForView} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 size={24} className="text-[#6D28D9]" />
          College CTQ Scorecard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Consolidated institutional performance metrics across all employees and faculty interviews.
        </p>
      </div>

      {/* 3.a Five Figures */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
            People Interviewed
          </span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {uniqueUsers.size}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
            Completed Audits
          </span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {completedAuditsCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
            CTQs Measured
          </span>
          <div className="text-2xl font-bold text-[#6D28D9] tabular-nums">
            {measuredCtqs.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
            % CTQs Met
          </span>
          <div className="text-2xl font-bold text-[#0F766E] tabular-nums">
            {percentMet}%
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
            CTQs Not Met
          </span>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">
            {notMetCount}
          </div>
        </div>
      </div>

      {/* 3.b Scorecard by Standard Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4 overflow-hidden">
        <div>
          <h3 className="text-base font-bold text-slate-900">Scorecard by Standard Code</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of CTQ compliance and average variance for each standard code cited.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Standard Code</th>
                <th className="py-2.5 px-3 text-right">Total CTQs</th>
                <th className="py-2.5 px-3 text-right">Met</th>
                <th className="py-2.5 px-3 text-right">At Risk</th>
                <th className="py-2.5 px-3 text-right">Not Met</th>
                <th className="py-2.5 px-3 text-right">No Data</th>
                <th className="py-2.5 px-3 text-right">Avg Gap %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {standardScorecardRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No completed audit data available yet.
                  </td>
                </tr>
              ) : (
                standardScorecardRows.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#6D28D9]">
                      {row.code}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums">{row.total}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-700 tabular-nums">{row.met}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-amber-700 tabular-nums">{row.atRisk}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-rose-700 tabular-nums">{row.notMet}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">{row.noData}</td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
                      {row.avgGap > 0 ? `+${row.avgGap}%` : `${row.avgGap}%`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.c All CTQs Table with Filters */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">All Measured CTQs</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by delay severity (Not Met → At Risk → Met → No data). Click any row to view full audit.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Not Met">Not Met</option>
              <option value="At Risk">At Risk</option>
              <option value="Met">Met</option>
              <option value="No data">No data</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="Faculty">Faculty</option>
              <option value="Program Chair">Program Chair</option>
              <option value="Administrative Staff">Administrative Staff</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">CTQ Requirement</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Reported</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCtqs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    No CTQs match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredCtqs.map((ctq, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedAuditForView(ctq.parentAudit)}
                    className="hover:bg-purple-50/50 transition-colors cursor-pointer"
                    title="Click to view full Service Quality Card"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[140px] lg:max-w-none truncate lg:whitespace-normal">
                      {ctq.service}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-[200px] lg:max-w-none truncate lg:whitespace-normal">
                      {ctq.ctq}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#6D28D9]">
                      {ctq.code !== 'None' ? ctq.code : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {ctq.targetValue !== null ? `${ctq.targetValue} ${ctq.unit}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {ctq.reportedValue !== null ? `${ctq.reportedValue} ${ctq.unit}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold tabular-nums">
                      {ctq.gap !== null
                        ? `${ctq.gap > 0 ? '+' : ''}${ctq.gap} (${ctq.gapPercent}%)`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">{getStatusChip(ctq.status)}</td>
                    <td className="py-2.5 px-3 text-slate-500">{ctq.roleCategory}</td>
                    <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                      {new Date(ctq.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.d All Audits List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">All Registered Audits ({allAudits.length})</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any audit to open read-only Service Quality Card and dialogue transcript.
          </p>
        </div>

        <div className="space-y-2.5">
          {allAudits.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedAuditForView(a)}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-purple-200 hover:bg-purple-50/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    {a.profileSnapshot?.displayName || 'Employee'}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-medium">
                    {a.profileSnapshot?.roleCategory} ({a.profileSnapshot?.position})
                  </span>
                </div>
                <div className="text-slate-600 font-semibold">
                  Service: {a.serviceCard?.serviceName || 'Session in progress'}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-400">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-semibold ${
                    a.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {a.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
