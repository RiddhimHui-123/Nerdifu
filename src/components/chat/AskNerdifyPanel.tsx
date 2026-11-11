import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TutorMode, StudyDocument, Subject, Highlight } from '../../types';
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Lightbulb,
  FileText,
  HelpCircle,
  Award,
  ChevronDown,
  Paperclip,
} from 'lucide-react';

interface AskNerdifyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  document: StudyDocument;
  subject: Subject;
  currentPage: number;
  selectedSnippet?: string;
  onClearSelectedSnippet: () => void;
  recentHighlights: Highlight[];
  onTriggerQuizFromContext: (topic: string, pageRange: string) => void;
  pendingPrompt?: string;
  onClearPendingPrompt: () => void;
}

export const AskNerdifyPanel: React.FC<AskNerdifyPanelProps> = ({
  isOpen,
  onClose,
  document,
  subject,
  currentPage,
  selectedSnippet,
  onClearSelectedSnippet,
  recentHighlights,
  onTriggerQuizFromContext,
  pendingPrompt,
  onClearPendingPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey! I'm **Nerdify**, your AI study tutor buddy. 🎓\n\nI have live visibility into **${document.title}** (currently looking at **Page ${currentPage}**).\n\nYou can highlight any sentence to ask me directly, click quick prompt chips below, or ask me to explain any tough concept!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<TutorMode>('socratic');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When a pending prompt comes from PDF selection ("Ask Nerdify")
  useEffect(() => {
    if (pendingPrompt && isOpen) {
      handleSendMessage(pendingPrompt);
      onClearPendingPrompt();
    }
  }, [pendingPrompt, isOpen]);

  const activePage = document.pages.find((p) => p.pageNumber === currentPage) || document.pages[0];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextSnippet: selectedSnippet,
      pageRef: currentPage,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (selectedSnippet) {
      onClearSelectedSnippet();
    }

    // Temporary streaming placeholder assistant message
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      pageRef: currentPage,
    };

    setMessages([...newMessages, assistantMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          mode,
          context: {
            subject: subject.name,
            docTitle: document.title,
            pageNum: currentPage,
            totalPages: document.totalPages,
            pageContent: activePage.content,
            selectedSnippet: selectedSnippet || (textToSend ? textToSend : undefined),
            recentHighlights: recentHighlights.filter((h) => h.docId === document.id),
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                  )
                );
              } else if (parsed.error) {
                accumulatedText += `\n\n*Error: ${parsed.error}*`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                  )
                );
              }
            } catch (err) {
              // Non-JSON line, ignore
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
      );
    } catch (err: any) {
      console.error('Chat stream error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  m.content ||
                  "I had trouble connecting to the Gemini tutor agent. Please verify that your GEMINI_API_KEY is active in the Secrets panel.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: `Chat session refreshed! Ready to explore **${document.title}** on Page ${currentPage}. How can I assist?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    `Summarize the key takeaways of Page ${currentPage}`,
    `Explain the most complex equation/concept on this page with an analogy`,
    `What are 2 tricky exam trap questions from this section?`,
    `Give me an active recall mnemonic for this material`,
  ];

  if (!isOpen) return null;

  return (
    <aside
      className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xl z-30 transition-all duration-200 ${
        isExpanded ? 'w-full md:w-[600px]' : 'w-full md:w-[410px]'
      }`}
    >
      {/* Top Header: Ask Gemini Style */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                Ask Nerdify
              </h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                AI Tutor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounded on Page {currentPage} of {document.title.slice(0, 22)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isExpanded ? 'Collapse width' : 'Expand width'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close Ask Nerdify side panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tutor Persona / Mode Switcher Bar */}
      <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tutor Style:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('socratic')}
            className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors ${
              mode === 'socratic'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Guides with thoughtful questions instead of just giving answers"
          >
            Socratic
          </button>
          <button
            onClick={() => setMode('feynman')}
            className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors ${
              mode === 'feynman'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Explains using simple everyday analogies (ELI12)"
          >
            Feynman
          </button>
          <button
            onClick={() => setMode('exam')}
            className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors ${
              mode === 'exam'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Focuses on exam traps and testing"
          >
            Exam Prep
          </button>
          <button
            onClick={() => setMode('summarizer')}
            className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors ${
              mode === 'summarizer'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Direct high-yield bulleted takeaways"
          >
            High-Yield
          </button>
        </div>
      </div>

      {/* Selected Text Attachment Badge (if user highlighted text in PDF) */}
      {selectedSnippet && (
        <div className="mx-3 mt-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-1.5 truncate">
            <Paperclip className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-amber-900 dark:text-amber-200 font-medium truncate">
              Attached quote: "{selectedSnippet.slice(0, 36)}..."
            </span>
          </div>
          <button
            onClick={onClearSelectedSnippet}
            className="p-1 text-amber-700 dark:text-amber-300 hover:text-amber-900"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
              {msg.role === 'assistant' ? (
                <>
                  <Bot className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Nerdify</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-300">You</span>
                </>
              )}
              <span>·</span>
              <span>{msg.timestamp}</span>
              {msg.pageRef && (
                <span className="text-indigo-600 dark:text-indigo-400">· p.{msg.pageRef}</span>
              )}
            </div>

            {/* Context snippet tag if user attached quote */}
            {msg.contextSnippet && (
              <div className="max-w-[85%] mb-1.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 border-l-2 border-amber-400 italic">
                "{msg.contextSnippet.slice(0, 90)}..."
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed max-w-[92%] relative group ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 rounded-tr-xs'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              {/* Formatted Message Content */}
              <div className="whitespace-pre-wrap space-y-2">
                {msg.content ? (
                  msg.content
                ) : msg.isStreaming ? (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200" />
                  </span>
                ) : null}
              </div>

              {/* Message Actions */}
              {msg.role === 'assistant' && msg.content && !msg.isStreaming && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      onTriggerQuizFromContext(
                        activePage.title,
                        `Page ${currentPage}`
                      )
                    }
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Award className="w-3 h-3" />
                    Quiz me on this
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isStreaming}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 rounded-lg whitespace-nowrap transition-colors disabled:opacity-50 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask Nerdify about Page ${currentPage} or any concept...`}
            rows={2}
            className="w-full p-2.5 pr-10 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-xs"
            title="Send to Nerdify"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-1.5 text-[10px] text-center text-slate-400 dark:text-slate-500">
          Nerdify agent has direct visibility of the active page and student notes.
        </p>
      </div>
    </aside>
  );
};
