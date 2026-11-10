import React from 'react';
import {
  Home,
  MessageSquare,
  FolderClock,
  User,
  BookOpen,
  BarChart3,
  FileText,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'interview'
  | 'records'
  | 'profile'
  | 'standards'
  | 'scorecard'
  | 'reports';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, isAdmin }) => {
  const userTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'interview', label: 'Interview', icon: MessageSquare },
    { id: 'records', label: 'My Records', icon: FolderClock },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  const adminTabs = [
    { id: 'standards', label: 'Standards', icon: BookOpen },
    { id: 'scorecard', label: 'Scorecard', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
  ] as const;

  const allTabs = isAdmin ? [...userTabs, ...adminTabs] : userTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-md lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto lg:w-auto lg:rounded-2xl lg:shadow-xl lg:border lg:border-purple-200/90 lg:p-1.5 lg:transition-all"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-[880px] lg:max-w-none mx-auto px-2 lg:px-0">
        <div
          className={`grid items-center h-16 lg:h-auto lg:flex lg:flex-row lg:items-center lg:gap-1 ${
            isAdmin ? 'grid-cols-7' : 'grid-cols-4'
          }`}
        >
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id as NavTab)}
                className={`flex flex-col lg:flex-row items-center justify-center h-full lg:h-auto py-1 lg:py-2 lg:px-3.5 lg:rounded-xl transition-all cursor-pointer relative shrink-0 ${
                  isActive
                    ? 'text-[#6D28D9] font-medium lg:font-semibold lg:bg-purple-50 lg:shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 lg:hover:bg-slate-100/80 lg:hover:text-slate-900'
                }`}
              >
                <Icon
                  size={19}
                  className={`transition-transform shrink-0 ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'
                  }`}
                />
                <span className="text-[10px] lg:text-xs tracking-tight mt-1 lg:mt-0 lg:ml-2 whitespace-nowrap truncate max-w-[50px] sm:max-w-none">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6D28D9] lg:hidden" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
