import React, { useState } from 'react';
import { SavedQuiz, QuizQuestion, Subject } from '../../types';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface QuizTakingViewProps {
  quiz: SavedQuiz;
  subject: Subject;
  onFinishQuiz: (completedQuiz: SavedQuiz) => void;
  onClose: () => void;
}

export const QuizTakingView: React.FC<QuizTakingViewProps> = ({
  quiz,
  subject,
  onFinishQuiz,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<number>(0);

  const currentQ: QuizQuestion = quiz.questions[currentIndex] || quiz.questions[0];
  const isAnswered = !!userAnswers[currentQ.id];

  const handleSelectOption = (option: string) => {
    if (isCompleted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
    setShowExplanation((prev) => ({
      ...prev,
      [currentQ.id]: true,
    }));
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = () => {
    let correctCount = 0;
    const gradedQuestions = quiz.questions.map((q) => {
      const ans = userAnswers[q.id] || '';
      const isCorrect = ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) correctCount++;
      return {
        ...q,
        userAnswer: ans,
        isCorrect,
      };
    });

    const calculatedScore = Math.round((correctCount / quiz.questions.length) * 100);
    setScore(calculatedScore);
    setIsCompleted(true);

    if (calculatedScore >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    const updatedQuiz: SavedQuiz = {
      ...quiz,
      questions: gradedQuestions,
      score: calculatedScore,
      completedAt: new Date().toISOString().split('T')[0],
    };

    onFinishQuiz(updatedQuiz);
  };

  const handleRetake = () => {
    setUserAnswers({});
    setShowExplanation({});
    setShowHint({});
    setIsCompleted(false);
    setCurrentIndex(0);
    setScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  {quiz.title}
                </h2>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  · {quiz.pageReference}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subject.name} · {quiz.questions.length} Questions
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

        {/* Progress Bar */}
        {!isCompleted && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 shrink-0">
            <div
              className="bg-indigo-600 h-1.5 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Quiz Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm">
          {!isCompleted ? (
            <>
              {/* Question Index & Tag */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px]">
                  {currentQ.type.replace('_', ' ')}
                </span>
              </div>

              {/* Question Text */}
              <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {currentQ.question}
              </h3>

              {/* Options List */}
              <div className="space-y-2.5">
                {currentQ.options && currentQ.options.length > 0 ? (
                  currentQ.options.map((option, optIdx) => {
                    const selected = userAnswers[currentQ.id] === option;
                    const isRightOption =
                      option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
                    const showFeedback = isAnswered;

                    let optionStyle =
                      'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';

                    if (showFeedback) {
                      if (isRightOption) {
                        optionStyle =
                          'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-medium';
                      } else if (selected && !isRightOption) {
                        optionStyle =
                          'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200';
                      }
                    } else if (selected) {
                      optionStyle =
                        'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-900 dark:text-indigo-200 font-medium';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(option)}
                        disabled={isAnswered}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition-all ${optionStyle}`}
                      >
                        <span className="flex-1 leading-relaxed">{option}</span>
                        {showFeedback && isRightOption && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {showFeedback && selected && !isRightOption && (
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  // Short answer text input
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Type your answer or key phrase..."
                      value={userAnswers[currentQ.id] || ''}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: e.target.value,
                        }))
                      }
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    {!isAnswered && (
                      <button
                        onClick={() =>
                          setShowExplanation((prev) => ({ ...prev, [currentQ.id]: true }))
                        }
                        className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                      >
                        Submit Answer &amp; Reveal Key
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Hint Accordion */}
              {currentQ.hint && (
                <div>
                  <button
                    onClick={() =>
                      setShowHint((prev) => ({
                        ...prev,
                        [currentQ.id]: !prev[currentQ.id],
                      }))
                    }
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHint[currentQ.id] ? 'Hide Hint' : 'Need a Hint?'}
                  </button>
                  {showHint[currentQ.id] && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 italic">
                      💡 {currentQ.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation Box (Visible once answered) */}
              {showExplanation[currentQ.id] && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs md:text-sm space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Nerdify Explanation:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </>
          ) : (
            // Results & Performance Summary View
            <div className="py-4 space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-600 text-white shadow-xl mx-auto">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  {score >= 80 ? 'Mastery Unlocked! 🌟' : score >= 60 ? 'Great Effort! 📚' : 'Needs Review! 💡'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You completed the Quiz Buster evaluation for {quiz.topic}
                </p>
              </div>

              {/* Score Display Card */}
              <div className="max-w-xs mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {score}%
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {quiz.questions.filter((q) => q.isCorrect).length} of {quiz.questions.length} questions answered correctly
                </p>
              </div>

              {/* Question-by-Question Review List */}
              <div className="text-left space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Review Questions:
                </h4>
                {quiz.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {q.question}
                      </p>
                      {q.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Correct:{' '}
                      </span>
                      {q.correctAnswer}
                    </p>
                    {!q.isCorrect && q.userAnswer && (
                      <p className="text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-rose-500">Your answer: </span>
                        {q.userAnswer}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 md:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          {!isCompleted ? (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNext}
                  disabled={!isAnswered}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors disabled:opacity-40"
                >
                  <span>
                    {currentIndex === quiz.questions.length - 1 ? 'Finish & Grade' : 'Next Question'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-xl"
              >
                Done / Back to Textbook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
