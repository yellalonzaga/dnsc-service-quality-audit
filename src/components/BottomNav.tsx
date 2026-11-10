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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-md"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-[880px] mx-auto px-2">
        <div
          className={`grid items-center h-16 ${
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
                className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer relative ${
                  isActive
                    ? 'text-[#6D28D9] font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'
                  }`}
                />
                <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap truncate max-w-[50px] sm:max-w-none">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6D28D9]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
