import React from 'react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  isAdmin: boolean;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, isAdmin, onProfileClick }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100/80 shadow-xs">
      <div className="max-w-[880px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
            DQ
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-slate-900 text-base leading-tight tracking-tight">
                DNSC Service Quality Audit
              </span>
              {isAdmin && (
                <span className="text-[11px] font-medium tracking-wide text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  Admin
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-normal">
              Davao del Norte State College · Panabo City
            </span>
          </div>
        </div>

        {/* User Avatar & Profile Trigger */}
        {user && (
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/60"
            title="View Profile & Settings"
          >
            <span className="text-xs font-medium text-slate-700 hidden sm:inline max-w-[120px] truncate">
              {user.displayName || 'My Profile'}
            </span>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-purple-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-medium text-xs">
                {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
