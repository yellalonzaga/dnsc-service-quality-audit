import React, { useState } from 'react';
import { Audit } from '../types';
import { ServiceCardView } from './ServiceCardView';
import { renderMarkdown } from '../lib/sanitize';
import { FolderClock, ArrowRight, FileCheck, Clock, ArrowLeft, MessageSquare } from 'lucide-react';

interface MyRecordsViewProps {
  audits: Audit[];
  onOpenAudit: (audit: Audit) => void;
}

export const MyRecordsView: React.FC<MyRecordsViewProps> = ({ audits, onOpenAudit }) => {
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [activeTab, setActiveTab] = useState<'card' | 'transcript'>('card');

  if (selectedAudit) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedAudit(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6D28D9] hover:underline cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to My Records</span>
          </button>

          {/* Toggle between Card and Transcript */}
          {selectedAudit.serviceCard && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'card'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Service Quality Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'transcript'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Interview Transcript
              </button>
            </div>
          )}
        </div>

        {activeTab === 'card' && selectedAudit.serviceCard ? (
          <ServiceCardView audit={selectedAudit} />
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Audit Transcript: {selectedAudit.serviceCard?.serviceName || 'Service Session'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Conducted on {new Date(selectedAudit.createdAt).toLocaleDateString()} · {selectedAudit.answerCount} answers
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-600 leading-relaxed">
              To review or continue live dialogue, you can also resume this audit directly in the Interview tab.
            </div>

            <button
              type="button"
              onClick={() => onOpenAudit(selectedAudit)}
              className="px-4 py-2 bg-[#6D28D9] text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <MessageSquare size={14} />
              <span>Open in Interview Room</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderClock size={24} className="text-[#6D28D9]" />
            My Service Audit Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical Total Quality Management audits and Critical-to-Quality cards you have conducted.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {audits.length} {audits.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      {audits.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm">
          <FolderClock size={40} className="mx-auto text-purple-300 mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">No Past Audits Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            You haven't conducted any service interviews yet. Start your first session to build your Voice of the Customer scorecard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => {
            const isCompleted = audit.status === 'completed';
            const serviceName = audit.serviceCard?.serviceName || 'In-Progress Service Audit';
            const dateStr = new Date(audit.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={audit.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-purple-200 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{dateStr}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Stage {audit.stage} ({audit.answerCount}/8 answers)
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{serviceName}</h3>

                  {audit.serviceCard && (
                    <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                      <span>
                        <strong>Score:</strong>{' '}
                        <span className="text-[#0F766E] font-bold">
                          {audit.serviceCard.serviceScore !== null
                            ? `${audit.serviceCard.serviceScore}% Met`
                            : 'N/A'}
                        </span>
                      </span>
                      <span>·</span>
                      <span>
                        <strong>CTQs:</strong> {audit.serviceCard.ctqs?.length || 0}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted ? (
                    <button
                      type="button"
                      onClick={() => setSelectedAudit(audit)}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-[#6D28D9] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileCheck size={14} />
                      <span>View Card</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenAudit(audit)}
                      className="px-4 py-2 bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Clock size={14} />
                      <span>Resume</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
