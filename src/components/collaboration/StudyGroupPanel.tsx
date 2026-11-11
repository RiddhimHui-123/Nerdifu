import React, { useState, useRef, useEffect } from 'react';
import {
  StudyRoomState,
  StudyPeer,
  GroupChatMessage,
  CollaborativeQuiz,
  StudyDocument,
} from '../../types';
import {
  Users,
  Send,
  Share2,
  BookOpen,
  Award,
  Sparkles,
  X,
  Plus,
  Play,
  ArrowRight,
  Eye,
  Radio,
  UserPlus,
} from 'lucide-react';

interface StudyGroupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  room: StudyRoomState;
  currentPeer: StudyPeer;
  currentDoc: StudyDocument;
  currentPage: number;
  onSendMessage: (content: string) => void;
  onShareView: () => void;
  onJumpToSharedView: (docId: string, page: number) => void;
  onOpenInviteModal: () => void;
  onOpenCoCreateQuiz: (quiz?: CollaborativeQuiz) => void;
  onStartQuizSession: (quiz: CollaborativeQuiz) => void;
}

export const StudyGroupPanel: React.FC<StudyGroupPanelProps> = ({
  isOpen,
  onClose,
  room,
  currentPeer,
  currentDoc,
  currentPage,
  onSendMessage,
  onShareView,
  onJumpToSharedView,
  onOpenInviteModal,
  onOpenCoCreateQuiz,
  onStartQuizSession,
}) => {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const quickDiscussionChips = [
    `Let's review Page ${currentPage} together!`,
    `Can someone explain the key mechanism here?`,
    `Who wants to test ourselves on this section?`,
  ];

  return (
    <aside className="w-80 md:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xl z-30 transition-all duration-200 animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Users className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 truncate">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display truncate">
                {room.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{room.peers.length} Peers Connected Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenInviteModal}
            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
            title="Invite more peers"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            title="Close study group panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Peer Presence Avatars Strip */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Study Group Peers
          </span>
          <button
            onClick={onShareView}
            className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            title="Broadcast current PDF page to peers"
          >
            <Share2 className="w-3 h-3" />
            <span>Share My View (p.{currentPage})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {room.peers.map((peer) => {
            const isMe = peer.id === currentPeer.id;
            return (
              <div
                key={peer.id}
                className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shrink-0 text-xs"
              >
                <div
                  style={{ backgroundColor: peer.color }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-xs shrink-0"
                >
                  {peer.name.charAt(0).toUpperCase()}
                </div>
                <div className="pr-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 leading-none">
                    {peer.name} {isMe && '(You)'}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {peer.currentPage ? `Page ${peer.currentPage}` : 'Active'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared View Broadcast Banner if active */}
      {room.sharedView && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 text-xs shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <div className="truncate">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {room.sharedView.sharedBy}
              </span>{' '}
              <span className="text-amber-800 dark:text-amber-300">
                viewing Page {room.sharedView.page}
              </span>
            </div>
          </div>
          <button
            onClick={() => onJumpToSharedView(room.sharedView!.docId, room.sharedView!.page)}
            className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shrink-0"
          >
            Jump to View
          </button>
        </div>
      )}

      {/* Collaborative Quizzes Strip */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Co-Created Quizzes ({room.quizzes.length})
          </span>
          <button
            onClick={() => onOpenCoCreateQuiz()}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>Co-Create Test</span>
          </button>
        </div>

        {room.quizzes.length > 0 && (
          <div className="space-y-1.5">
            {room.quizzes.map((q) => (
              <div
                key={q.id}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
              >
                <div className="truncate">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {q.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {q.questions.length} Qs · {q.status === 'active' ? 'Live Challenge' : 'Drafting'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onOpenCoCreateQuiz(q)}
                    className="px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onStartQuizSession(q)}
                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md flex items-center gap-0.5"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Take</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {room.messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center py-1 text-[11px] text-slate-400 italic">
                {msg.content}
              </div>
            );
          }

          if (msg.type === 'view_share' && msg.sharedView) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    {msg.peerName}
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  Shared view to <strong>Page {msg.sharedView.page}</strong> of "{msg.sharedView.docTitle}"
                </p>
                <button
                  onClick={() => onJumpToSharedView(msg.sharedView!.docId, msg.sharedView!.page)}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Sync to this page</span>
                </button>
              </div>
            );
          }

          if (msg.type === 'quiz_invite' && msg.quizData) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">
                    {msg.peerName}
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{msg.content}</p>
                <button
                  onClick={() => {
                    const quiz = room.quizzes.find((q) => q.id === msg.quizData?.quizId);
                    if (quiz) {
                      onOpenCoCreateQuiz(quiz);
                    }
                  }}
                  className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1"
                >
                  <Award className="w-3 h-3" />
                  <span>Join Co-Created Quiz</span>
                </button>
              </div>
            );
          }

          const isMe = msg.peerId === currentPeer.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 px-1 text-[10px] text-slate-400">
                <span
                  style={{ color: msg.peerColor }}
                  className="font-bold"
                >
                  {msg.peerName} {isMe && '(You)'}
                </span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={`p-3 rounded-2xl text-xs md:text-sm leading-relaxed max-w-[88%] ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Discussion Prompts */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickDiscussionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(chip)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={`Message your study group...`}
          className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors shadow-xs"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
