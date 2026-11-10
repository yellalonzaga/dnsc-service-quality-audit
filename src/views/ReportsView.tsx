import React, { useState } from 'react';
import { ScorecardReportDoc, Audit, InteractionMessage } from '../types';
import { renderMarkdown } from '../lib/sanitize';
import {
  FileText,
  Sparkles,
  Download,
  Save,
  Clock,
  Eye,
  FileCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface ReportsViewProps {
  savedReports: ScorecardReportDoc[];
  allAudits: Audit[];
  allInteractions: InteractionMessage[];
  onGenerateReport: () => Promise<{ markdown: string; stats: any; scorecardByStandard?: any[]; modelUsed?: string }>;
  onSaveReport: (report: ScorecardReportDoc) => Promise<void>;
  onShowToast: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  savedReports,
  allAudits,
  allInteractions,
  onGenerateReport,
  onSaveReport,
  onShowToast,
}) => {
  const [currentReport, setCurrentReport] = useState<{
    markdown: string;
    stats: any;
    scorecardByStandard?: any[];
    modelUsed?: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeViewingReport, setActiveViewingReport] = useState<ScorecardReportDoc | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await onGenerateReport();
      setCurrentReport(result);
      onShowToast('Consolidated report generated successfully.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to generate consolidated report.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentReport) return;
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const newReport: ScorecardReportDoc = {
        id: crypto.randomUUID(),
        title: `Consolidated Quality Report - ${today}`,
        markdown: currentReport.markdown,
        stats: currentReport.stats,
        scorecardByStandard: currentReport.scorecardByStandard,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin',
        modelUsed: currentReport.modelUsed,
      };

      await onSaveReport(newReport);
      onShowToast('Report saved to archive.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save report.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadMarkdownFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Required: "Download transcripts (.md)" button exports every audit
  // (profile without email, full transcript in order, Service Quality Card) for the testing report.
  const handleDownloadTranscripts = () => {
    if (allAudits.length === 0) {
      onShowToast('No audits available to export.', 'info');
      return;
    }

    let md = `# Davao del Norte State College (DNSC)
## TQM Service Quality Audit - Comprehensive Audit Transcripts & CTQ Cards
**Export Date:** ${new Date().toISOString()}
**Total Audits:** ${allAudits.length}

---

`;

    for (const audit of allAudits) {
      const prof = audit.profileSnapshot || {};
      const card = audit.serviceCard;

      // Group interactions for this audit and sort by timestamp
      const auditInteractions = allInteractions
        .filter((m) => m.auditId === audit.id)
        .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

      md += `### Audit ID: ${audit.id}
**Employee:** ${prof.displayName || 'Employee'} *(Email omitted for privacy)*
**Role Category:** ${prof.roleCategory || 'N/A'}
**Office / Institute:** ${prof.office || 'N/A'}
**Position:** ${prof.position || 'N/A'}
**Job Description:** ${prof.jobDescription || 'N/A'}
**Years in Role:** ${prof.yearsInRole ?? 'N/A'}
**Status:** ${audit.status} (Stage ${audit.stage}, ${audit.answerCount} answers)
**Audit Date:** ${new Date(audit.createdAt).toLocaleDateString()}

#### Interview Transcript
`;

      if (auditInteractions.length === 0) {
        md += `*No interactions recorded.*\n\n`;
      } else {
        for (const msg of auditInteractions) {
          const speaker = msg.role === 'assistant' ? 'Audit Guide' : prof.displayName || 'Employee';
          const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
          md += `**${speaker}** *(${time})*:\n${msg.content}\n\n`;
        }
      }

      if (card) {
        md += `#### Service Quality Card
- **Service Name:** ${card.serviceName}
- **Target Customers:** ${card.customers?.join(', ') || 'N/A'}
- **Service Score:** ${card.serviceScore !== null ? `${card.serviceScore}% Met` : 'N/A'}
- **Summary:** ${card.summary}

##### Critical-to-Quality (CTQ) Tree
| Need | Driver | CTQ Requirement | Code | Target | Reported | Gap | Status | Delay Cause |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;
        for (const ctq of card.ctqs || []) {
          md += `| ${ctq.need} | ${ctq.driver} | ${ctq.ctq} | ${ctq.code} | ${ctq.targetValue ?? '—'} ${ctq.unit} | ${ctq.reportedValue ?? '—'} ${ctq.unit} | ${ctq.gap ?? '—'} | ${ctq.status} | ${ctq.delayCause || '—'} |\n`;
        }

        md += `\n##### Actionable Improvements\n`;
        for (const imp of card.improvements || []) {
          md += `- **${imp.action}** (Owner: ${imp.owner}, Measure: ${imp.measure}, Standard: ${imp.code})\n`;
        }

        md += `\n##### Frontline Strengths\n`;
        for (const str of card.strengths || []) {
          md += `- ${str}\n`;
        }
      }

      md += `\n---\n\n`;
    }

    downloadMarkdownFile(`dnsc_audit_transcripts_${new Date().toISOString().split('T')[0]}.md`, md);
    onShowToast('Transcripts exported to Markdown.', 'success');
  };

  const displayedMarkdown = activeViewingReport?.markdown || currentReport?.markdown || '';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-[#6D28D9]" />
            Consolidated Quality Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-computed TQM synthesis with Gemini institutional analysis (PROMPT 3).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Download transcripts (.md) button (Rule 4) */}
          <button
            type="button"
            onClick={handleDownloadTranscripts}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download every audit transcript and card for accreditation testing"
          >
            <Download size={14} />
            <span>Download Transcripts (.md)</span>
          </button>

          {/* Generate Consolidated Report button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-[#6D28D9] hover:bg-[#5b21b6] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <span>Generate Consolidated Report</span>
          </button>
        </div>
      </div>

      {/* Generated Report Display Area */}
      {displayedMarkdown ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D28D9] block">
                {activeViewingReport ? 'Archived Quality Report' : 'Newly Generated Report'}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {activeViewingReport?.title || 'Consolidated Service Quality Report'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {!activeViewingReport && currentReport && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save to Archive</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  downloadMarkdownFile(
                    `dnsc_consolidated_report_${new Date().toISOString().split('T')[0]}.md`,
                    displayedMarkdown
                  )
                }
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>Download .md</span>
              </button>

              {activeViewingReport && (
                <button
                  type="button"
                  onClick={() => setActiveViewingReport(null)}
                  className="px-3 py-1.5 bg-purple-50 text-[#6D28D9] font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close Archive View
                </button>
              )}
            </div>
          </div>

          {/* Rendered Markdown with sanitized DOMPurify */}
          <div
            className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(displayedMarkdown) }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-sm">
          <Sparkles size={36} className="mx-auto text-purple-300 mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            No Active Report Generated
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Click "Generate Consolidated Report" to aggregate all VOC interviews and produce an accreditation-ready quality report.
          </p>
        </div>
      )}

      {/* Saved Reports Archive List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock size={18} className="text-[#6D28D9]" />
          Saved Consolidated Reports ({savedReports.length})
        </h3>

        {savedReports.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No saved reports in Firestore archive yet.</p>
        ) : (
          <div className="space-y-2.5">
            {savedReports.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-purple-200 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{r.title}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Saved on {new Date(r.createdAt).toLocaleDateString()}</span>
                    {r.modelUsed && <span>· Model: {r.modelUsed}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveViewingReport(r)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadMarkdownFile(`${r.title.toLowerCase().replace(/\s+/g, '_')}.md`, r.markdown)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                    title="Download .md"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
