import React, { useState } from 'react';
import { Subject, StudyDocument, QuestionType, QuizQuestion, SavedQuiz } from '../../types';
import {
  Sparkles,
  X,
  Sliders,
  HelpCircle,
  FileQuestion,
  BookOpen,
  Award,
  Layers,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface QuizBusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  document: StudyDocument;
  initialTopic?: string;
  initialPageRef?: string;
  initialSnippet?: string;
  onQuizGenerated: (quiz: SavedQuiz) => void;
}

export const QuizBusterModal: React.FC<QuizBusterModalProps> = ({
  isOpen,
  onClose,
  subject,
  document,
  initialTopic = '',
  initialPageRef = '',
  initialSnippet = '',
  onQuizGenerated,
}) => {
  const [topic, setTopic] = useState(initialTopic || document.pages[0]?.title || 'Key concepts');
  const [pageNumbers, setPageNumbers] = useState(initialPageRef || `Pages 1-${document.totalPages}`);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'adaptive'>('medium');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleType = (type: QuestionType) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMessage('Please specify a topic or concept to test.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    // Extract relevant text from the document pages
    let combinedSourceText = initialSnippet || '';
    if (!combinedSourceText) {
      combinedSourceText = document.pages
        .map((p) => `[Page ${p.pageNumber}: ${p.title}]\n${p.content}`)
        .join('\n\n');
    }

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.name,
          docTitle: document.title,
          topic,
          pageNumbers,
          sourceText: combinedSourceText,
          count: questionCount,
          difficulty,
          questionTypes,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Quiz generation failed');
      }

      const generatedData = await response.json();

      const newQuiz: SavedQuiz = {
        id: `quiz-${Date.now()}`,
        subjectId: subject.id,
        docId: document.id,
        title: generatedData.title || `Quiz: ${topic}`,
        topic: generatedData.topic || topic,
        pageReference: generatedData.pageReference || pageNumbers,
        summary: generatedData.summary || `Practice test covering ${topic}`,
        questions: (generatedData.questions || []).map((q: any, i: number) => ({
          id: q.id || `q-${i + 1}`,
          type: q.type || 'multiple_choice',
          question: q.question,
          options: q.options || (q.type === 'true_false' ? ['True', 'False'] : []),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: q.hint,
        })),
        totalQuestions: (generatedData.questions || []).length || questionCount,
        createdAt: new Date().toISOString().split('T')[0],
      };

      onQuizGenerated(newQuiz);
      onClose();
    } catch (err: any) {
      console.error('Quiz Buster generator error:', err);
      setErrorMessage(
        err.message || 'Could not generate quiz. Check your Gemini API key in the Secrets panel.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  Quiz Buster
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  AI Test Generator
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mention topics &amp; page numbers to generate an active recall test.
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

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs md:text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          {/* Subject & Document Context Pill */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {document.title}
              </span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 shrink-0 font-medium">
              {subject.name}
            </span>
          </div>

          {/* Topic & Concepts Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              1. Mention Topics &amp; Core Concepts
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., PFK-1 regulation, Chemiosmosis rotary motor, Redox reactions"
              className="w-full p-3 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Specify what ideas or formulas you want Nerdify to challenge you on.
            </p>
          </div>

          {/* Page Numbers Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                2. Target Page Numbers
              </label>
              <input
                type="text"
                value={pageNumbers}
                onChange={(e) => setPageNumbers(e.target.value)}
                placeholder="e.g., Pages 2-4, Page 3, or All"
                className="w-full p-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                3. Number of Questions
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 8, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      questionCount === count
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              4. Difficulty Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'adaptive'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 text-xs font-medium capitalize rounded-lg border transition-all ${
                    difficulty === lvl
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              5. Question Types
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleType('multiple_choice')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
                  questionTypes.includes('multiple_choice')
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <CheckCircle
                  className={`w-3.5 h-3.5 ${
                    questionTypes.includes('multiple_choice') ? 'text-indigo-600' : 'text-slate-300'
                  }`}
                />
                Multiple Choice (MCQ)
              </button>

              <button
                type="button"
                onClick={() => toggleType('true_false')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
                  questionTypes.includes('true_false')
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <CheckCircle
                  className={`w-3.5 h-3.5 ${
                    questionTypes.includes('true_false') ? 'text-indigo-600' : 'text-slate-300'
                  }`}
                />
                True / False
              </button>

              <button
                type="button"
                onClick={() => toggleType('short_answer')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
                  questionTypes.includes('short_answer')
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <CheckCircle
                  className={`w-3.5 h-3.5 ${
                    questionTypes.includes('short_answer') ? 'text-indigo-600' : 'text-slate-300'
                  }`}
                />
                Short Answer / Concept Drill
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Powered by Gemini agentic reasoning
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Test Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bust Out Quiz!</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
