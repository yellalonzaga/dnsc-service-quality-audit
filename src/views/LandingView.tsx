import React from 'react';
import { ShieldCheck, MessageSquare, Award, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn, isLoading }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-[580px] bg-white rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100 p-8 sm:p-10 text-center">
        {/* Emblem */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#0F766E] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
          <ShieldCheck size={36} className="stroke-[2]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          DNSC Service Quality Audit
        </h1>
        <p className="text-sm font-medium text-[#0F766E] mb-6">
          Davao del Norte State College · Total Quality Management (TQM)
        </p>

        {/* Required one line about the app */}
        <p className="text-base text-slate-600 leading-relaxed mb-8">
          A Total Quality Management audit platform designed to evaluate campus service response times, uncover delivery delays, and align everyday operations with DNSC service standards.
        </p>

        {/* Highlight features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100/60">
            <MessageSquare size={20} className="text-[#6D28D9] mb-2" />
            <h4 className="font-semibold text-xs text-slate-800 mb-1">AI Audit Guide</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              8-question Voice of the Customer (VOC) interview.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100/60">
            <Award size={20} className="text-[#0F766E] mb-2" />
            <h4 className="font-semibold text-xs text-slate-800 mb-1">CTQ Tree</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Compare reported times with college benchmarks.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <ShieldCheck size={20} className="text-slate-700 mb-2" />
            <h4 className="font-semibold text-xs text-slate-800 mb-1">Quality Scorecard</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Institutional visibility for service improvements.
            </p>
          </div>
        </div>

        {/* Sign In with Google Button */}
        <button
          type="button"
          onClick={onSignIn}
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
              <ArrowRight size={16} className="text-slate-400 ml-1" />
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 mt-4">
          Open to all DNSC employees and academic community members
        </p>
      </div>
    </div>
  );
};
