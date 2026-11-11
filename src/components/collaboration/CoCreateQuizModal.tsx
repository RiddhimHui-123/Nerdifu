import React, { useState } from 'react';
import { CollaborativeQuiz, QuizQuestion, QuestionType } from '../../types';
import {
  Award,
  Sparkles,
  Plus,
  Play,
  X,
  CheckCircle2,
  HelpCircle,
  Users,
  Trophy,
  ArrowRight,
} from 'lucide-react';

interface CoCreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: CollaborativeQuiz;
  currentPeerName: string;
  onAddQuestion: (question: Omit<QuizQuestion, 'id'>) => void;
  onRequestAiQuestion: () => void;
  onLaunchQuiz: () => void;
  onStartQuizSession: (quiz: CollaborativeQuiz) => void;
}

export const CoCreateQuizModal: React.FC<CoCreateQuizModalProps> = ({
  isOpen,
  onClose,
  quiz,
  currentPeerName,
  onAddQuestion,
  onRequestAiQuestion,
  onLaunchQuiz,
  onStartQuizSession,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qPrompt, setQPrompt] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!isOpen) return null;

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim() || !qCorrect.trim()) return;

    const options =
      qType === 'multiple_choice'
        ? [qOptA, qOptB, qOptC, qOptD].filter((o) => o.trim().length > 0)
        : ['True', 'False'];

    onAddQuestion({
      type: qType,
      question: qPrompt.trim(),
      options: options.length > 0 ? options : [qCorrect],
      correctAnswer: qCorrect.trim(),
      explanation: qExplanation.trim() || `Contributed by ${currentPeerName}`,
      contributedBy: currentPeerName,
    });

    setQPrompt('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect('');
    setQExplanation('');
    setShowAddForm(false);
  };

  const handleRequestAi = () => {
    setIsAiLoading(true);
    onRequestAiQuestion();
    setTimeout(() => {
      setIsAiLoading(false);
    }, 1800);
  };

  const scoresList = Object.entries(quiz.scores || {}).map(([peerId, data]) => ({
    peerId,
    ...data,
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  {quiz.title}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  quiz.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {quiz.status === 'active' ? 'Active Challenge' : 'Co-Creation Draft'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {quiz.topic} · {quiz.pageReference} · Started by {quiz.createdBy}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {quiz.questions.length} Collaborative Questions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestAi}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAiLoading ? 'Drafting...' : 'Ask AI to Suggest Question'}</span>
            </button>

            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Contribute Question</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Form to add question */}
          {showAddForm && (
            <form
              onSubmit={handleManualAdd}
              className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Add Question to Group Quiz
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Question Prompt
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which complex of the ETC receives electrons from NADH?"
                  value={qPrompt}
                  onChange={(e) => setQPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400">Option A</label>
                  <input
                    type="text"
                    required
                    placeholder="Complex I"
                    value={qOptA}
                    onChange={(e) => setQOptA(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Option B</label>
                  <input
                    type="text"
                    required
                    placeholder="Complex II"
                    value={qOptB}
                    onChange={(e) => setQOptB(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Option C</label>
                  <input
                    type="text"
                    placeholder="Complex III"
                    value={qOptC}
                    onChange={(e) => setQOptC(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Option D</label>
                  <input
                    type="text"
                    placeholder="Complex IV"
                    value={qOptD}
                    onChange={(e) => setQOptD(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complex I"
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Explanation
                  </label>
                  <input
                    type="text"
                    placeholder="Why this answer is right..."
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  Add Question
                </button>
              </div>
            </form>
          )}

          {/* Group Live Leaderboard if active */}
          {scoresList.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                Live Group Leaderboard
              </h4>
              <div className="space-y-1.5">
                {scoresList.map((entry, idx) => (
                  <div
                    key={entry.peerId}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 w-4">#{idx + 1}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {entry.peerName}
                      </span>
                    </div>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {entry.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Co-created Questions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions in this Quiz ({quiz.questions.length})
            </h4>

            {quiz.questions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 space-y-2">
                <p>No questions added yet.</p>
                <p className="text-[11px]">
                  Click "Contribute Question" or "Ask AI to Suggest Question" above!
                </p>
              </div>
            ) : (
              quiz.questions.map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {qIdx + 1}. {q.question}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                      By {q.contributedBy || 'Peer'}
                    </span>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border text-[11px] ${
                            opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200 font-medium'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    {q.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            {quiz.questions.length} questions ready
          </span>

          <div className="flex items-center gap-2">
            {quiz.status === 'drafting' ? (
              <button
                onClick={onLaunchQuiz}
                disabled={quiz.questions.length === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Group Test</span>
              </button>
            ) : (
              <button
                onClick={() => onStartQuizSession(quiz)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Take Challenge Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
