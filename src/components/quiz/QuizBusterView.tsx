import React, { useState } from 'react';
import { Subject, StudyDocument, SavedQuiz } from '../../types';
import {
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Play,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface QuizBusterViewProps {
  subjects: Subject[];
  activeSubjectId: string;
  onSubjectChange: (id: string) => void;
  documents: StudyDocument[];
  quizzes: SavedQuiz[];
  onOpenCreateModal: () => void;
  onStartQuiz: (quiz: SavedQuiz) => void;
}

export const QuizBusterView: React.FC<QuizBusterViewProps> = ({
  subjects,
  activeSubjectId,
  onSubjectChange,
  documents,
  quizzes,
  onOpenCreateModal,
  onStartQuiz,
}) => {
  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const subjectQuizzes = quizzes.filter((q) => q.subjectId === activeSubject.id);

  // Stats calculation
  const completedQuizzes = subjectQuizzes.filter((q) => q.score !== undefined);
  const averageScore =
    completedQuizzes.length > 0
      ? Math.round(
          completedQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / completedQuizzes.length
        )
      : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Banner Section */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500 text-white shadow-md">
                <Award className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
                Quiz Buster
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Active Recall Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Generate custom test questions from any topic and page number in your textbook. Reinforce active recall, isolate knowledge gaps, and get instant Gemini explanations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Subject Selector */}
            <select
              value={activeSubjectId}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="p-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>

            {/* Launch Create Quiz Modal Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Test Questions</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Generated Tests
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
              {subjectQuizzes.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">For {activeSubject.name}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Average Mastery Score
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {averageScore > 0 ? `${averageScore}%` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across all completed quizzes</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Questions Answered
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {subjectQuizzes.reduce((acc, q) => acc + (q.score !== undefined ? q.questions.length : 0), 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active recall reps completed</p>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Saved Quizzes for {activeSubject.name}
            </h2>
            <span className="text-xs text-slate-400">
              {subjectQuizzes.length} available
            </span>
          </div>

          {subjectQuizzes.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
              <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No quizzes generated for this subject yet.
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Click "Generate Test Questions" to mention your study topics and page numbers, and Quiz Buster will build a targeted test.
              </p>
              <button
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create First Quiz</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {quiz.pageReference}
                      </span>
                      {quiz.score !== undefined ? (
                        <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 tabular-nums">
                          {quiz.score}% Score
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Unattempted
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {quiz.summary || `Covers ${quiz.topic}`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {quiz.questions.length} Questions · {quiz.createdAt}
                    </span>
                    <button
                      onClick={() => onStartQuiz(quiz)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{quiz.score !== undefined ? 'Retake Test' : 'Take Quiz'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
