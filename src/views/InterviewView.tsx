import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { Audit, InteractionMessage } from '../types';
import { renderMarkdown } from '../lib/sanitize';
import { Modal } from '../components/Modal';
import {
  Send,
  Sparkles,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface InterviewViewProps {
  user: User;
  audit: Audit;
  interactions: InteractionMessage[];
  onSendMessage: (text: string, existingClientMessageId?: string) => Promise<void>;
  onBuildServiceCard: () => Promise<void>;
  isGeneratingCard: boolean;
  onShowToast: (msg: string, type: 'info' | 'success' | 'error', actionLabel?: string, onAction?: () => void) => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  user,
  audit,
  interactions,
  onSendMessage,
  onBuildServiceCard,
  isGeneratingCard,
  onShowToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [serverBusyError, setServerBusyError] = useState(false);
  const [showBuildCardModal, setShowBuildCardModal] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ text: string; clientMessageId: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Live timer for "Thinking... Ns" (Build Rule 8.E)
  useEffect(() => {
    if (isSubmitting) {
      setThinkingSeconds(0);
      setServerBusyError(false);
      timerRef.current = setInterval(() => {
        setThinkingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setThinkingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitting]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions, isSubmitting]);

  const stages = [
    { num: 1, name: 'Service & Customers', questions: 'Questions 1–2', desc: 'Core service, request channels & steps' },
    { num: 2, name: 'Voice of the Customer', questions: 'Questions 3–4', desc: 'Direct complaints & customer expectations' },
    { num: 3, name: 'Time & Delays', questions: 'Questions 5–6', desc: 'Turnaround duration & process bottlenecks' },
    { num: 4, name: 'Improvements', questions: 'Questions 7–8', desc: 'Actionable solutions & DNSC standards fit' },
  ];

  const userMessagesCount = interactions.filter((m) => m.role === 'user').length;
  const canBuildCard = userMessagesCount >= 4;
  const isClosing = userMessagesCount >= 8;

  const handleSend = async (overrideText?: string, existingClientId?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    const trimmed = textToSend.trim();

    if (!trimmed) return;
    if (trimmed.length > 2000) {
      onShowToast('Message exceeds the 2,000 character limit.', 'error');
      return;
    }

    // Rule 8.D: "On Send, clear the input at once, save the message, and call the server only after the save succeeds."
    const savedTextForFallback = trimmed;
    const clientMessageId = existingClientId || crypto.randomUUID();

    if (!overrideText) {
      setInputText('');
    }
    setIsSubmitting(true);
    setServerBusyError(false);

    try {
      await onSendMessage(trimmed, clientMessageId);
      setLastFailedMessage(null);
    } catch (err: any) {
      console.error('Send error:', err);
      // Put text back into input (Rule 8.D)
      setInputText(savedTextForFallback);
      setLastFailedMessage({ text: savedTextForFallback, clientMessageId });

      if (err.message?.includes('502') || err.message?.includes('504') || err.message?.includes('busy')) {
        setServerBusyError(true);
      }

      onShowToast('Could not save message or contact server.', 'error', 'Retry Save', () => {
        handleSend(savedTextForFallback, clientMessageId);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting) {
        handleSend();
      }
    }
  };

  const userInitials = (user.displayName || user.email || 'EM')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-9.5rem)] max-w-[880px] lg:max-w-[1200px] mx-auto">
      {/* Left Column (about 2/3 on 1024px+): Transcript & Input */}
      <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-3xl shadow-sm border border-purple-100 overflow-hidden">
        {/* Mobile-only Segmented Stage Bar (hidden on 1024px+ screens) */}
        <div className="bg-slate-50 border-b border-purple-100 px-4 py-3 shrink-0 lg:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Interview Progress: Stage {audit.stage} of 4
            </span>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {userMessagesCount} of 8 Answers Given
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {stages.map((st) => {
              const isPassed = audit.stage > st.num;
              const isCurrent = audit.stage === st.num;
              return (
                <div key={st.num} className="flex flex-col gap-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isPassed
                        ? 'bg-[#0F766E]'
                        : isCurrent
                        ? 'bg-[#6D28D9]'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] truncate ${
                      isCurrent
                        ? 'font-bold text-[#6D28D9]'
                        : isPassed
                        ? 'text-[#0F766E] font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.num}. {st.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile-only Build Service Card Banner (hidden on 1024px+ screens) */}
        {canBuildCard && audit.status !== 'completed' && (
          <div
            className={`px-4 py-2.5 flex items-center justify-between shrink-0 border-b lg:hidden ${
              isClosing
                ? 'bg-purple-50 border-purple-200 text-purple-900 animate-pulse'
                : 'bg-teal-50/70 border-teal-100 text-teal-900'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <Sparkles size={16} className={isClosing ? 'text-[#6D28D9]' : 'text-[#0F766E]'} />
              <span className="font-semibold">
                {isClosing
                  ? 'Interview completed! Build your Service Quality Card now.'
                  : 'Sufficient interview data collected (4+ answers).'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowBuildCardModal(true)}
              disabled={isGeneratingCard}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                isClosing
                  ? 'bg-[#6D28D9] hover:bg-[#5b21b6] text-white'
                  : 'bg-[#0F766E] hover:bg-[#0d655e] text-white'
              }`}
            >
              {isGeneratingCard ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              <span>Build Service Card</span>
            </button>
          </div>
        )}

        {/* Meeting Transcript Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">
          {interactions.map((msg) => {
            const isGuide = msg.role === 'assistant';
            const timeStr = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={msg.id}
                className="flex items-start gap-3.5 pb-6 border-b border-slate-100/80 last:border-b-0 animate-in fade-in duration-150"
              >
                {/* Round Avatar */}
                {isGuide ? (
                  <div className="w-9 h-9 rounded-full bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    AG
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#0F766E] text-white font-semibold text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    {userInitials}
                  </div>
                )}

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-900">
                      {isGuide ? 'Audit Guide' : user.displayName || 'You'}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {timeStr}
                    </span>
                    {msg.modelUsed && (
                      <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-mono">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>

                  <div
                    className="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                </div>
              </div>
            );
          })}

          {/* Live Thinking Indicator (Rule 8.E) */}
          {isSubmitting && (
            <div className="flex items-start gap-3.5 pb-4 animate-in fade-in">
              <div className="w-9 h-9 rounded-full bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center shrink-0 animate-pulse">
                AG
              </div>
              <div className="flex-1">
                <span className="font-semibold text-xs text-slate-900 block mb-1">
                  Audit Guide
                </span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 text-[#6D28D9] text-xs font-medium rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-[#6D28D9] animate-ping" />
                  <span>Thinking… {thinkingSeconds}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Server Busy Error Banner with Retry */}
          {serverBusyError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>The server is busy. Click Retry.</span>
              </div>
              {lastFailedMessage && (
                <button
                  type="button"
                  onClick={() => handleSend(lastFailedMessage.text, lastFailedMessage.clientMessageId)}
                  className="px-3 py-1 bg-amber-200 hover:bg-amber-300 font-semibold text-amber-950 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (pinned at bottom, stays visible, Rule 8.E) */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-purple-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="space-y-2"
          >
            <div className="relative">
              <textarea
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                placeholder="Type your response to the Audit Guide... (Press Enter to send, Shift+Enter for newline)"
                maxLength={2000}
                className="w-full px-3.5 py-2.5 pr-14 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] transition-all resize-none disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={isSubmitting || !inputText.trim()}
                className="absolute right-2.5 bottom-3.5 p-2 rounded-lg bg-[#6D28D9] hover:bg-[#5b21b6] text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                title="Send reply"
              >
                <Send size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Supports English, Filipino, Cebuano, or Bisaya</span>
              <span className="tabular-nums">{inputText.length}/2000 chars</span>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column (about 1/3 on 1024px+, sticky): 4 Stages vertical list, Answer count & Build Card button */}
      <div className="hidden lg:flex lg:col-span-4 flex-col gap-5 sticky top-20 h-fit">
        {/* Stages & Progress Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Interview Progress
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#6D28D9] border border-purple-100 tabular-nums">
                Answer {userMessagesCount} of 8
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6D28D9] to-[#0F766E] transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.round((userMessagesCount / 8) * 100))}%` }}
              />
            </div>
          </div>

          {/* Vertical 4 Stages List */}
          <div className="space-y-3">
            {stages.map((st) => {
              const isPassed = audit.stage > st.num;
              const isCurrent = audit.stage === st.num;

              return (
                <div
                  key={st.num}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-50/70 border-purple-200 ring-2 ring-[#6D28D9]/10'
                      : isPassed
                      ? 'bg-teal-50/40 border-teal-100'
                      : 'bg-slate-50/60 border-slate-200/70 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                        isCurrent
                          ? 'bg-[#6D28D9] text-white'
                          : isPassed
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check size={14} className="stroke-[3]" /> : st.num}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-[#6D28D9]'
                              : isPassed
                              ? 'text-[#0F766E]'
                              : 'text-slate-700'
                          }`}
                        >
                          {st.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {st.questions}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Build Service Card Action Block */}
          <div className="pt-2 border-t border-slate-100">
            {audit.status === 'completed' ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">Service Quality Card Completed</span>
              </div>
            ) : canBuildCard ? (
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isClosing
                    ? 'bg-gradient-to-br from-purple-50 to-teal-50 border-purple-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles
                    size={16}
                    className={`shrink-0 mt-0.5 ${
                      isClosing ? 'text-[#6D28D9] animate-pulse' : 'text-[#0F766E]'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isClosing ? 'Interview Finished' : 'Ready to Build'}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      {isClosing
                        ? 'All 8 questions answered. Compile your CTQ tree and service benchmarks now.'
                        : 'You have answered 4+ questions. You can generate the Service Quality Card now or continue to completion.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBuildCardModal(true)}
                  disabled={isGeneratingCard}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isClosing
                      ? 'bg-[#6D28D9] hover:bg-[#5b21b6] text-white ring-2 ring-purple-300'
                      : 'bg-[#0F766E] hover:bg-[#0d655e] text-white'
                  }`}
                >
                  {isGeneratingCard ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  <span>Build Service Card</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-500 text-xs flex items-center gap-2.5">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <span>
                  Provide at least <strong>4 answers</strong> to unlock your Service Quality Card ({userMessagesCount}/4).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* DNSC Quality Standards Notice */}
        <div className="bg-purple-50/60 rounded-3xl p-4 border border-purple-100/80 text-xs text-purple-950 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-[#6D28D9] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-purple-900/80">
            Answers are benchmarked against DNSC Citizen's Charter standards. All data is securely isolated to your account.
          </p>
        </div>
      </div>

      {/* Build Service Card In-App Confirmation Modal (Rule 8.E) */}
      <Modal
        isOpen={showBuildCardModal}
        title="Build Service Quality Card"
        onClose={() => setShowBuildCardModal(false)}
        confirmLabel="Generate Card"
        isLoading={isGeneratingCard}
        onConfirm={async () => {
          setShowBuildCardModal(false);
          await onBuildServiceCard();
        }}
      >
        <p className="mb-3">
          The Audit Guide will now compile your Voice of the Customer (VOC) interview into a formal <strong>Critical-to-Quality (CTQ) Service Quality Card</strong>.
        </p>
        <p className="mb-2">This includes:</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
          <li>Extracted customer quotes and core needs</li>
          <li>Three-column CTQ Tree (Need → Driver → CTQ)</li>
          <li>Benchmark comparisons against DNSC service standards</li>
          <li>Turnaround time gaps, identified delay causes, and recommendations</li>
        </ul>
      </Modal>
    </div>
  );
};
