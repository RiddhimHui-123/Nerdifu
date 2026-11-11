import React, { useState } from 'react';
import { Subject, StudyTask, SavedQuiz, StudyDocument } from '../../types';
import {
  Folder,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Trash2,
  Play,
  Award,
  BookOpen,
  ArrowRight,
  Filter,
  Flame,
  Check,
  Tag,
} from 'lucide-react';

interface SubjectSlotsViewProps {
  subjects: Subject[];
  activeSubjectId: string;
  onSelectSubject: (id: string) => void;
  onAddSubject: (subject: Omit<Subject, 'id' | 'totalMinutesStudied'>) => void;
  tasks: StudyTask[];
  onAddTask: (task: Omit<StudyTask, 'id' | 'createdAt' | 'completedPomodoros'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  quizzes: SavedQuiz[];
  documents: StudyDocument[];
  onOpenDocument: (docId: string) => void;
  onStartFocusOnTask: (task: StudyTask) => void;
}

export const SubjectSlotsView: React.FC<SubjectSlotsViewProps> = ({
  subjects,
  activeSubjectId,
  onSelectSubject,
  onAddSubject,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  quizzes,
  documents,
  onOpenDocument,
  onStartFocusOnTask,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskEstimatedPomodoros, setTaskEstimatedPomodoros] = useState<number>(2);
  const [taskDueDate, setTaskDueDate] = useState<string>('2026-11-15');

  // New subject form state
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subColor, setSubColor] = useState<'emerald' | 'sky' | 'purple' | 'amber' | 'rose'>('emerald');
  const [subDesc, setSubDesc] = useState('');
  const [subHours, setSubHours] = useState<number>(15);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const subjectTasks = tasks.filter((t) => t.subjectId === activeSubject.id);
  const subjectQuizzes = quizzes.filter((q) => q.subjectId === activeSubject.id);
  const subjectDocs = documents.filter((d) => d.subjectId === activeSubject.id);

  const filteredTasks = subjectTasks.filter((t) => {
    if (filterTab === 'pending') return !t.completed;
    if (filterTab === 'completed') return t.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onAddTask({
      subjectId: activeSubject.id,
      title: taskTitle.trim(),
      priority: taskPriority,
      completed: false,
      estimatedPomodoros: taskEstimatedPomodoros,
      dueDate: taskDueDate,
    });

    setTaskTitle('');
    setShowNewTaskModal(false);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !subCode.trim()) return;

    onAddSubject({
      name: subName.trim(),
      code: subCode.trim().toUpperCase(),
      color: subColor,
      icon: 'BookOpen',
      description: subDesc.trim() || 'Custom study course workspace',
      targetHours: subHours || 10,
    });

    setSubName('');
    setSubCode('');
    setShowNewSubjectModal(false);
  };

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'high':
        return 'text-rose-600 dark:text-rose-400 font-semibold';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 font-medium';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  const studiedHours = (activeSubject.totalMinutesStudied / 60).toFixed(1);
  const progressPercent = Math.min(
    100,
    Math.round((activeSubject.totalMinutesStudied / (activeSubject.targetHours * 60)) * 100)
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Column: Subject Slots Rail */}
      <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Subject Slots
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Workspaces per course
            </p>
          </div>
          <button
            onClick={() => setShowNewSubjectModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Slot</span>
          </button>
        </div>

        {/* Subjects list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {subjects.map((sub) => {
            const isSelected = sub.id === activeSubject.id;
            const subTasksCount = tasks.filter((t) => t.subjectId === sub.id && !t.completed).length;

            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {sub.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {sub.name}
                    </h3>
                  </div>
                  {subTasksCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
                      {subTasksCount} to do
                    </span>
                  )}
                </div>

                {/* Micro study progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>
                      {(sub.totalMinutesStudied / 60).toFixed(1)} / {sub.targetHours}h studied
                    </span>
                    <span className="font-semibold">{Math.min(100, Math.round((sub.totalMinutesStudied / (sub.targetHours * 60)) * 100))}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((sub.totalMinutesStudied / (sub.targetHours * 60)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Subject Workspace & To-Do List */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Subject Banner & Target Hours Progress */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {activeSubject.code} · Active Workspace
            </span>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
              {activeSubject.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              {activeSubject.description}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[220px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Course Mastery</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {studiedHours} / {activeSubject.targetHours}h
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
              {progressPercent}% towards weekly target
            </p>
          </div>
        </div>

        {/* Subject Documents & Quizzes Quick Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Binder */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Study Materials ({subjectDocs.length})
              </h3>
            </div>
            <div className="space-y-2">
              {subjectDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {doc.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {doc.totalPages} pages · {doc.author}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Past Quizzes */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Quiz Buster History ({subjectQuizzes.length})
              </h3>
            </div>
            <div className="space-y-2">
              {subjectQuizzes.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No tests generated yet. Go to textbook &amp; click Quiz Buster!
                </p>
              ) : (
                subjectQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {q.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {q.pageReference} · {q.questions.length} questions
                      </p>
                    </div>
                    {q.score !== undefined ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 tabular-nums">
                        {q.score}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* To-Do List Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                Subject To-Do Tasks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actionable study objectives tagged with Pomodoro intervals
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    filterTab === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({subjectTasks.length})
                </button>
                <button
                  onClick={() => setFilterTab('pending')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    filterTab === 'pending'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Pending ({subjectTasks.filter((t) => !t.completed).length})
                </button>
                <button
                  onClick={() => setFilterTab('completed')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    filterTab === 'completed'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Done
                </button>
              </div>

              {/* Add task button */}
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Task Items */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p>No study tasks found for this slot.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Add a task above to schedule focus time and track progress.
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs group ${
                    task.completed
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/40" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold text-slate-800 dark:text-slate-200 truncate ${
                          task.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className={priorityBadge(task.priority)}>
                          {task.priority.toUpperCase()} Priority
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <span>🍅</span>
                          <span>
                            {task.completedPomodoros} / {task.estimatedPomodoros} Pomodoros
                          </span>
                        </span>
                        {task.dueDate && (
                          <>
                            <span>·</span>
                            <span>Due {task.dueDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!task.completed && (
                      <button
                        onClick={() => onStartFocusOnTask(task)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        title="Start Pomodoro timer for this task"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Focus</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Add Task for {activeSubject.name}
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Task Title
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Read section 9.3 and complete practice questions"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Est. Pomodoros
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={taskEstimatedPomodoros}
                  onChange={(e) => setTaskEstimatedPomodoros(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-600 dark:text-slate-300">Due Date</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Subject Modal */}
      {showNewSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubject}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Create New Subject Slot
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Course Name
              </label>
              <input
                type="text"
                required
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g., Organic Chemistry II, Microeconomics"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  placeholder="e.g., CHEM 220"
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Target Hours/Wk
                </label>
                <input
                  type="number"
                  min="2"
                  max="40"
                  value={subHours}
                  onChange={(e) => setSubHours(parseInt(e.target.value) || 10)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-600 dark:text-slate-300">
                Description / Syllabus Notes
              </label>
              <textarea
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                placeholder="Brief course objectives..."
                rows={2}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewSubjectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Create Slot
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
