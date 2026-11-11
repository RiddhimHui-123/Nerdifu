import React, { useState, useEffect, useRef } from 'react';
import { PomodoroSettings, PomodoroPreset, Subject } from '../../types';
import { studyAudio } from '../../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle,
  Clock,
  BookOpen,
  Coffee,
  Sparkles,
  Music,
} from 'lucide-react';

interface PomodoroTrackerProps {
  subjects: Subject[];
  activeSubjectId: string;
  onSubjectChange: (subjectId: string) => void;
  onSessionComplete: (minutesStudied: number, subjectId: string) => void;
  onClose?: () => void;
}

export const PomodoroTracker: React.FC<PomodoroTrackerProps> = ({
  subjects,
  activeSubjectId,
  onSubjectChange,
  onSessionComplete,
}) => {
  const [settings, setSettings] = useState<PomodoroSettings>({
    preset: 'classic',
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    soundEnabled: true,
    ambientSound: 'none',
    ambientVolume: 0.5,
  });

  const [currentMode, setCurrentMode] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [timeLeft, setTimeLeft] = useState<number>(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(3);
  const [totalMinutesToday, setTotalMinutesToday] = useState<number>(75);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Reference for interval timer
  const timerRef = useRef<any>(null);

  // Apply preset configuration
  const handleSelectPreset = (preset: PomodoroPreset) => {
    let work = 25;
    let sBreak = 5;
    let lBreak = 15;

    if (preset === 'deep') {
      work = 50;
      sBreak = 10;
      lBreak = 30;
    } else if (preset === 'sprint') {
      work = 15;
      sBreak = 3;
      lBreak = 10;
    }

    setSettings((prev) => ({
      ...prev,
      preset,
      workDuration: work,
      shortBreak: sBreak,
      longBreak: lBreak,
    }));

    if (currentMode === 'work') {
      setTimeLeft(work * 60);
    } else if (currentMode === 'short_break') {
      setTimeLeft(sBreak * 60);
    } else {
      setTimeLeft(lBreak * 60);
    }
    setIsRunning(false);
  };

  // Switch modes manually
  const switchMode = (mode: 'work' | 'short_break' | 'long_break') => {
    setCurrentMode(mode);
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(settings.workDuration * 60);
    } else if (mode === 'short_break') {
      setTimeLeft(settings.shortBreak * 60);
    } else {
      setTimeLeft(settings.longBreak * 60);
    }
  };

  // Ambient sound handling
  useEffect(() => {
    if (isRunning && settings.ambientSound !== 'none') {
      studyAudio.startAmbient(settings.ambientSound, settings.ambientVolume);
    } else {
      studyAudio.stopAmbient();
    }
    return () => studyAudio.stopAmbient();
  }, [isRunning, settings.ambientSound, settings.ambientVolume]);

  // Main countdown tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentMode, settings]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (settings.soundEnabled) {
      studyAudio.playCompletionChime();
    }

    if (currentMode === 'work') {
      const newSessionCount = completedSessions + 1;
      setCompletedSessions(newSessionCount);
      setTotalMinutesToday((prev) => prev + settings.workDuration);
      onSessionComplete(settings.workDuration, activeSubjectId);

      // Determine next break
      if (newSessionCount % settings.sessionsBeforeLongBreak === 0) {
        switchMode('long_break');
      } else {
        switchMode('short_break');
      }
    } else {
      switchMode('work');
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (currentMode === 'work') {
      setTimeLeft(settings.workDuration * 60);
    } else if (currentMode === 'short_break') {
      setTimeLeft(settings.shortBreak * 60);
    } else {
      setTimeLeft(settings.longBreak * 60);
    }
  };

  const handleSkip = () => {
    if (currentMode === 'work') {
      switchMode('short_break');
    } else {
      switchMode('work');
    }
  };

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const totalDurationForMode =
    currentMode === 'work'
      ? settings.workDuration * 60
      : currentMode === 'short_break'
      ? settings.shortBreak * 60
      : settings.longBreak * 60;

  const progressPercent = Math.min(100, Math.max(0, ((totalDurationForMode - timeLeft) / totalDurationForMode) * 100));

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header Title & Subject Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
                Focus Time Tracker
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Pomodoro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Structured intervals for high cognitive retention and stamina.
            </p>
          </div>

          {/* Subject Slot Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 px-2">Subject Slot:</span>
            <select
              value={activeSubjectId}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Breakup Preset Tabs */}
        <div className="flex items-center justify-between p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl">
          {[
            { id: 'classic', label: 'Classic (25 / 5 / 15)' },
            { id: 'deep', label: 'Deep Work (50 / 10 / 30)' },
            { id: 'sprint', label: 'Quick Sprint (15 / 3 / 10)' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                if (preset.id === 'custom') {
                  setShowSettings(true);
                } else {
                  handleSelectPreset(preset.id as PomodoroPreset);
                }
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                settings.preset === preset.id && !showSettings
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Work / Short Break / Long Break Mode Selector */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => switchMode('work')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              currentMode === 'work'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Study Focus ({settings.workDuration}m)
          </button>
          <button
            onClick={() => switchMode('short_break')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              currentMode === 'short_break'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Short Break ({settings.shortBreak}m)
          </button>
          <button
            onClick={() => switchMode('long_break')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              currentMode === 'long_break'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Long Break ({settings.longBreak}m)
          </button>
        </div>

        {/* Main Circular Clock Display Card */}
        <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          {/* Circular Progress Ring */}
          <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-500 ${
                  currentMode === 'work'
                    ? 'stroke-indigo-600 dark:stroke-indigo-500'
                    : currentMode === 'short_break'
                    ? 'stroke-emerald-500'
                    : 'stroke-sky-500'
                }`}
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Digits */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {formattedTime}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">
                {currentMode === 'work'
                  ? `Focusing: ${activeSubject.name}`
                  : currentMode === 'short_break'
                  ? 'Recharge & Hydrate'
                  : 'Deep Mental Rest'}
              </span>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                Session #{completedSessions + 1}
              </span>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handleReset}
              className="p-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg flex items-center gap-2 transform active:scale-95 transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/25'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause Focus</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              className="p-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Skip to next session"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ambient Focus Sounds Player */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Study Ambience
              </span>
              <span className="text-[11px] text-slate-400">
                Web Audio synthesized background sound
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'none', label: 'Off' },
              { id: 'lofi', label: 'Lo-Fi Chill' },
              { id: 'rain', label: 'Gentle Rain' },
              { id: 'whitenoise', label: 'White Noise' },
              { id: 'library', label: 'Library' },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    ambientSound: snd.id as any,
                  }))
                }
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  settings.ambientSound === snd.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {totalMinutesToday}m
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              Focused Today
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-2xl font-extrabold text-amber-500 tabular-nums">
              {completedSessions}
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              Sessions Completed
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-2xl font-extrabold text-emerald-500 tabular-nums">
              5 Days
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              Study Streak 🔥
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
