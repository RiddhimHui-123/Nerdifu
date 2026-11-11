import React from 'react';
import {
  Sparkles,
  BookOpen,
  Award,
  Clock,
  FolderKanban,
  Sun,
  Moon,
  GraduationCap,
  Users,
} from 'lucide-react';

export type MainViewTab = 'reader' | 'quiz_buster' | 'timer' | 'subjects';

interface HeaderProps {
  activeTab: MainViewTab;
  onTabChange: (tab: MainViewTab) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isGroupOpen: boolean;
  onToggleGroup: () => void;
  peerCount: number;
  onOpenInviteModal: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  activeSubjectCode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isChatOpen,
  onToggleChat,
  isGroupOpen,
  onToggleGroup,
  peerCount,
  onOpenInviteModal,
  isDark,
  onToggleDark,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between gap-8 z-40 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
          <GraduationCap className="w-4 h-4" />
        </div>
        <button
          onClick={() => onTabChange('reader')}
          className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          Nerdify
        </button>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-6 md:gap-8 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 overflow-x-auto scrollbar-none py-1">
        <button
          onClick={() => onTabChange('reader')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'reader'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Study Material</span>
        </button>

        <button
          onClick={() => onTabChange('quiz_buster')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'quiz_buster'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Quiz Buster</span>
        </button>

        <button
          onClick={() => onTabChange('timer')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'timer'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-rose-500" />
          <span>Focus Timer</span>
        </button>

        <button
          onClick={() => onTabChange('subjects')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'subjects'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-emerald-500" />
          <span>Subject Slots</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Study Group + Ask AI + Dark Mode) */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Collaborative Study Group Button */}
        <button
          onClick={onToggleGroup}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shrink-0 ${
            isGroupOpen
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Toggle Collaborative Study Group Panel"
        >
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Study Group</span>
          <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-bold rounded-full tabular-nums">
            {peerCount}
          </span>
        </button>

        {/* Ask Nerdify AI button */}
        <button
          onClick={onToggleChat}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 ${
            isChatOpen
              ? 'bg-indigo-600 text-white shadow-indigo-500/25'
              : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
          }`}
          title="Toggle Ask Nerdify AI Tutor Side Panel"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Ask AI</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDark}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

