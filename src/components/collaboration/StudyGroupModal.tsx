import React, { useState } from 'react';
import { Subject, StudyPeer } from '../../types';
import {
  Users,
  Copy,
  Check,
  Share2,
  Plus,
  ArrowRight,
  X,
  Sparkles,
  Radio,
  BookOpen,
} from 'lucide-react';

interface StudyGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
  roomName: string;
  peers: StudyPeer[];
  userName: string;
  userColor: string;
  onUpdateUserMeta: (name: string, color: string) => void;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomName: string, subjectId: string) => void;
  subjects: Subject[];
}

export const StudyGroupModal: React.FC<StudyGroupModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
  roomName,
  peers,
  userName,
  userColor,
  onUpdateUserMeta,
  onJoinRoom,
  onCreateRoom,
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'join' | 'create'>('invite');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState(subjects[0]?.id || 'subj-bio');
  const [tempName, setTempName] = useState(userName);
  const [tempColor, setTempColor] = useState(userColor);

  if (!isOpen) return null;

  const inviteLink = `${window.location.origin}?room=${encodeURIComponent(currentRoomId)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = () => {
    if (tempName.trim()) {
      onUpdateUserMeta(tempName.trim(), tempColor);
    }
  };

  const avatarColors = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Purple
  ];

  const suggestedRooms = [
    { id: 'BIO-CIRCLES-101', name: 'Cellular Respiration Prep Circle', count: 2, subject: 'Biology' },
    { id: 'CALC-TAYLOR-7', name: 'Taylor Series & Convergence Group', count: 1, subject: 'Calculus' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 via-amber-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Study Group Collaboration
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share PDF pages, co-create quizzes, and discuss live.
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

        {/* Navigation Tabs */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'invite'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Invite Peers
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'join'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Join Another Room
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create New Room
          </button>
        </div>

        {/* Tab 1: Invite Peers to Current Room */}
        {activeTab === 'invite' && (
          <div className="p-6 space-y-5 text-xs">
            {/* Active Room Info */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Current Session
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {peers.length} Peers Active
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {roomName}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Room ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentRoomId}</span>
              </p>
            </div>

            {/* Invite Links Box */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Direct Invite Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 text-[11px]">Or share room code:</span>
                <button
                  onClick={handleCopyCode}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono font-bold flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Share2 className="w-3 h-3" />}
                  <span>{currentRoomId} (Copy Code)</span>
                </button>
              </div>
            </div>

            {/* Peer Profile Customization */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                Your Peer Display Profile
              </span>
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: tempColor }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                >
                  {tempName.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSaveProfile}
                    placeholder="Your Display Name"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex items-center gap-2">
                    {avatarColors.map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          setTempColor(col);
                          onUpdateUserMeta(tempName, col);
                        }}
                        style={{ backgroundColor: col }}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          tempColor === col ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Join Existing Room */}
        {activeTab === 'join' && (
          <div className="p-6 space-y-5 text-xs">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Enter Room Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. BIO-CIRCLES-101"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase"
                />
                <button
                  onClick={() => {
                    if (joinCodeInput.trim()) {
                      onJoinRoom(joinCodeInput.trim());
                      onClose();
                    }
                  }}
                  disabled={!joinCodeInput.trim()}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-40"
                >
                  Join
                </button>
              </div>
            </div>

            {/* Suggested active rooms */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Study Circles
              </span>
              {suggestedRooms.map((sr) => (
                <div
                  key={sr.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{sr.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {sr.id} · {sr.subject}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onJoinRoom(sr.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-700 rounded-lg shadow-xs hover:bg-indigo-50 dark:hover:bg-slate-600"
                  >
                    Enter
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Create New Room */}
        {activeTab === 'create' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newRoomName.trim()) {
                onCreateRoom(newRoomName.trim(), newRoomSubject);
                onClose();
              }
            }}
            className="p-6 space-y-4 text-xs"
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Study Group Session Name
              </label>
              <input
                type="text"
                required
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Molecular Bio Midterm Cram Circle"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Subject Course
              </label>
              <select
                value={newRoomSubject}
                onChange={(e) => setNewRoomSubject(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('invite')}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
              >
                Launch Study Room
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
