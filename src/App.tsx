import React, { useState, useEffect } from 'react';
import {
  Subject,
  StudyDocument,
  Highlight,
  Annotation,
  StudyTask,
  SavedQuiz,
  HighlightColor,
  StudyRoomState,
  StudyPeer,
  CollaborativeQuiz,
} from './types';
import {
  INITIAL_SUBJECTS,
  INITIAL_DOCUMENTS,
  INITIAL_HIGHLIGHTS,
  INITIAL_ANNOTATIONS,
  INITIAL_TASKS,
  INITIAL_QUIZZES,
} from './data/defaultData';
import { collabSocket } from './utils/collabSocket';
import { generateSamplePdfBlob } from './utils/samplePdf';
import { Header, MainViewTab } from './components/layout/Header';
import { PdfViewer } from './components/pdf/PdfViewer';
import { AskNerdifyPanel } from './components/chat/AskNerdifyPanel';
import { QuizBusterModal } from './components/quiz/QuizBusterModal';
import { QuizTakingView } from './components/quiz/QuizTakingView';
import { QuizBusterView } from './components/quiz/QuizBusterView';
import { PomodoroTracker } from './components/timer/PomodoroTracker';
import { SubjectSlotsView } from './components/subjects/SubjectSlotsView';
import { StudyGroupModal } from './components/collaboration/StudyGroupModal';
import { StudyGroupPanel } from './components/collaboration/StudyGroupPanel';
import { CoCreateQuizModal } from './components/collaboration/CoCreateQuizModal';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Main active tab navigation
  const [activeTab, setActiveTab] = useState<MainViewTab>('reader');

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('nerdify_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });
  const [activeSubjectId, setActiveSubjectId] = useState<string>('subj-bio');

  // Documents state
  const [documents, setDocuments] = useState<StudyDocument[]>(() => {
    const saved = localStorage.getItem('nerdify_documents');
    const docs: StudyDocument[] = saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    return docs.map((doc) => {
      if (!doc.fileDataUrl) {
        return {
          ...doc,
          fileDataUrl: generateSamplePdfBlob(
            doc.title,
            doc.author,
            doc.pages.map((p) => ({ title: p.title, content: p.content }))
          ),
        };
      }
      return doc;
    });
  });
  const [activeDocId, setActiveDocId] = useState<string>('doc-bio-1');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    const saved = localStorage.getItem('nerdify_highlights');
    return saved ? JSON.parse(saved) : INITIAL_HIGHLIGHTS;
  });

  // Annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    const saved = localStorage.getItem('nerdify_annotations');
    return saved ? JSON.parse(saved) : INITIAL_ANNOTATIONS;
  });

  // Tasks state
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('nerdify_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // Quizzes state
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>(() => {
    const saved = localStorage.getItem('nerdify_quizzes');
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  // Ask Nerdify side panel state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedSnippetForChat, setSelectedSnippetForChat] = useState<string | undefined>(undefined);
  const [pendingPromptForChat, setPendingPromptForChat] = useState<string | undefined>(undefined);

  // Quiz Buster modal & session state
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [quizModalInitialTopic, setQuizModalInitialTopic] = useState<string>('');
  const [quizModalInitialPageRef, setQuizModalInitialPageRef] = useState<string>('');
  const [quizModalInitialSnippet, setQuizModalInitialSnippet] = useState<string>('');
  const [activeQuizSession, setActiveQuizSession] = useState<SavedQuiz | null>(null);

  // -------------------------------------------------------------
  // Collaborative Study Group State
  // -------------------------------------------------------------
  const [isGroupOpen, setIsGroupOpen] = useState<boolean>(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [activeCoCreateQuiz, setActiveCoCreateQuiz] = useState<CollaborativeQuiz | null>(null);

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('nerdify_user_name') || 'Riddhima';
  });
  const [userColor, setUserColor] = useState<string>(() => {
    return localStorage.getItem('nerdify_user_color') || '#6366f1';
  });

  const [currentPeer, setCurrentPeer] = useState<StudyPeer>({
    id: 'peer-local',
    name: userName,
    color: userColor,
    isHost: false,
    currentDocId: activeDocId,
    currentPage: currentPage,
    joinedAt: 'Just now',
  });

  const [room, setRoom] = useState<StudyRoomState>({
    id: 'BIO-CIRCLES-101',
    name: 'Cellular Respiration Prep Circle',
    subjectId: 'subj-bio',
    hostId: '',
    peers: [],
    messages: [],
    sharedView: null,
    annotations: [],
    highlights: [],
    quizzes: [],
  });

  // Connect to WebSocket room on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room') || 'BIO-CIRCLES-101';

    collabSocket.connect().then(() => {
      collabSocket.joinRoom(roomParam, userName, userColor, activeDocId, currentPage);
    });

    const unsubInit = collabSocket.on('room:init', (payload: any) => {
      if (payload.currentPeer) setCurrentPeer(payload.currentPeer);
      if (payload.room) {
        setRoom(payload.room);

        // Merge room collaborative highlights into local view (idempotent)
        if (payload.room.highlights && payload.room.highlights.length > 0) {
          setHighlights((prev) => {
            const existingIds = new Set(prev.map((h) => h.id));
            const newToAdd = payload.room.highlights.filter((h: any) => !existingIds.has(h.id));
            return [...newToAdd, ...prev];
          });
        }

        // Merge room collaborative annotations into local view
        if (payload.room.annotations && payload.room.annotations.length > 0) {
          setAnnotations((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newToAdd = payload.room.annotations.filter((a: any) => !existingIds.has(a.id));
            return [...prev, ...newToAdd];
          });
        }
      }
    });

    const unsubPeerJoined = collabSocket.on('peer:joined', ({ peer, message }: any) => {
      setRoom((prev) => ({
        ...prev,
        peers: [...prev.peers.filter((p) => p.id !== peer.id), peer],
        messages: message ? [...prev.messages, message] : prev.messages,
      }));
    });

    const unsubPeerLeft = collabSocket.on('peer:left', ({ peerId, message }: any) => {
      setRoom((prev) => ({
        ...prev,
        peers: prev.peers.filter((p) => p.id !== peerId),
        messages: message ? [...prev.messages, message] : prev.messages,
      }));
    });

    const unsubChat = collabSocket.on('chat:message', (msg: any) => {
      setRoom((prev) => ({
        ...prev,
        messages: [...prev.messages, msg],
      }));
    });

    const unsubView = collabSocket.on('view:updated', ({ sharedView, message }: any) => {
      setRoom((prev) => ({
        ...prev,
        sharedView,
        messages: message ? [...prev.messages, message] : prev.messages,
      }));
    });

    const unsubAnnCreated = collabSocket.on('annotation:created', (newAnn: any) => {
      setAnnotations((prev) => (prev.some((a) => a.id === newAnn.id) ? prev : [...prev, newAnn]));
      setRoom((prev) => ({
        ...prev,
        annotations: prev.annotations.some((a) => a.id === newAnn.id)
          ? prev.annotations
          : [...prev.annotations, newAnn],
      }));
    });

    const unsubAnnDeleted = collabSocket.on('annotation:deleted', ({ annotationId }: any) => {
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
      setRoom((prev) => ({
        ...prev,
        annotations: prev.annotations.filter((a) => a.id !== annotationId),
      }));
    });

    const unsubHlCreated = collabSocket.on('highlight:created', (newHl: any) => {
      setHighlights((prev) => (prev.some((h) => h.id === newHl.id) ? prev : [newHl, ...prev]));
      setRoom((prev) => ({
        ...prev,
        highlights: prev.highlights.some((h) => h.id === newHl.id)
          ? prev.highlights
          : [newHl, ...prev.highlights],
      }));
    });

    const unsubHlDeleted = collabSocket.on('highlight:deleted', ({ highlightId }: any) => {
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      setRoom((prev) => ({
        ...prev,
        highlights: prev.highlights.filter((h) => h.id !== highlightId),
      }));
    });

    const unsubQuizUpdated = collabSocket.on('quiz:updated', ({ quiz, message }: any) => {
      setRoom((prev) => ({
        ...prev,
        quizzes: [quiz, ...prev.quizzes.filter((q) => q.id !== quiz.id)],
        messages: message ? [...prev.messages, message] : prev.messages,
      }));
      setActiveCoCreateQuiz((current) => (current && current.id === quiz.id ? quiz : current));
    });

    const unsubQuizLaunched = collabSocket.on('quiz:launched', ({ quiz, message }: any) => {
      setRoom((prev) => ({
        ...prev,
        quizzes: [quiz, ...prev.quizzes.filter((q) => q.id !== quiz.id)],
        messages: message ? [...prev.messages, message] : prev.messages,
      }));
      setActiveCoCreateQuiz((current) => (current && current.id === quiz.id ? quiz : current));
    });

    const unsubQuizScore = collabSocket.on('quiz:score_updated', ({ quiz, message }: any) => {
      setRoom((prev) => ({
        ...prev,
        quizzes: [quiz, ...prev.quizzes.filter((q) => q.id !== quiz.id)],
        messages: message ? [...prev.messages, message] : prev.messages,
      }));
      setActiveCoCreateQuiz((current) => (current && current.id === quiz.id ? quiz : current));
    });

    return () => {
      unsubInit();
      unsubPeerJoined();
      unsubPeerLeft();
      unsubChat();
      unsubView();
      unsubAnnCreated();
      unsubAnnDeleted();
      unsubHlCreated();
      unsubHlDeleted();
      unsubQuizUpdated();
      unsubQuizLaunched();
      unsubQuizScore();
    };
  }, []);

  // Update peer user profile
  const handleUpdateUserMeta = (name: string, color: string) => {
    setUserName(name);
    setUserColor(color);
    localStorage.setItem('nerdify_user_name', name);
    localStorage.setItem('nerdify_user_color', color);
    setCurrentPeer((prev) => ({ ...prev, name, color }));
    collabSocket.joinRoom(room.id, name, color, activeDocId, currentPage);
  };

  // Join or Create Room
  const handleJoinRoom = (roomId: string) => {
    collabSocket.joinRoom(roomId, userName, userColor, activeDocId, currentPage);
  };

  const handleCreateRoom = (newRoomName: string, subjectId: string) => {
    const newRoomId = `GROUP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    collabSocket.joinRoom(newRoomId, userName, userColor, activeDocId, currentPage);
    setActiveSubjectId(subjectId);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('nerdify_subjects', JSON.stringify(subjects));
  }, [subjects]);
  useEffect(() => {
    localStorage.setItem('nerdify_documents', JSON.stringify(documents));
  }, [documents]);
  useEffect(() => {
    localStorage.setItem('nerdify_highlights', JSON.stringify(highlights));
  }, [highlights]);
  useEffect(() => {
    localStorage.setItem('nerdify_annotations', JSON.stringify(annotations));
  }, [annotations]);
  useEffect(() => {
    localStorage.setItem('nerdify_tasks', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem('nerdify_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  // Active Subject & Document resolution
  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  let activeDoc = documents.find((d) => d.id === activeDocId);
  if (!activeDoc || activeDoc.subjectId !== activeSubject.id) {
    const subjectDoc = documents.find((d) => d.subjectId === activeSubject.id);
    if (subjectDoc) {
      activeDoc = subjectDoc;
    } else {
      activeDoc = documents[0];
    }
  }

  // Handle switching subject
  const handleSelectSubject = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    const firstDoc = documents.find((d) => d.subjectId === subjectId);
    if (firstDoc) {
      setActiveDocId(firstDoc.id);
      setCurrentPage(1);
    }
  };

  // Add new highlight & broadcast
  const handleAddHighlight = (highlightData: Omit<Highlight, 'id' | 'createdAt'>) => {
    const newHl: Highlight = {
      ...highlightData,
      id: `hl-${Date.now()}`,
      authorId: currentPeer.id,
      authorName: currentPeer.name,
      authorColor: currentPeer.color,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setHighlights((prev) => [newHl, ...prev]);
    collabSocket.createHighlight(newHl);
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    collabSocket.deleteHighlight(id);
  };

  const handleUpdateHighlightNote = (id: string, note: string) => {
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, note } : h)));
  };

  // Add new annotation sticky note & broadcast
  const handleAddAnnotation = (annotationData: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newAnn: Annotation = {
      ...annotationData,
      id: `ann-${Date.now()}`,
      authorId: currentPeer.id,
      authorName: currentPeer.name,
      authorColor: currentPeer.color,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAnnotations((prev) => [...prev, newAnn]);
    collabSocket.createAnnotation(newAnn);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    collabSocket.deleteAnnotation(id);
  };

  const handleUpdateAnnotation = (id: string, content: string) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, content } : a)));
  };

  // Share current PDF view with group
  const handleShareViewWithGroup = () => {
    if (!activeDoc) return;
    collabSocket.shareView(
      activeDoc.id,
      activeDoc.title,
      currentPage,
      undefined,
      currentPeer.color
    );
  };

  const handleJumpToSharedView = (docId: string, page: number) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (targetDoc) {
      setActiveSubjectId(targetDoc.subjectId);
      setActiveDocId(targetDoc.id);
      setCurrentPage(page);
      setActiveTab('reader');
    } else {
      setCurrentPage(page);
      setActiveTab('reader');
    }
  };

  // Add new subject
  const handleAddSubject = (newSubData: Omit<Subject, 'id' | 'totalMinutesStudied'>) => {
    const newSub: Subject = {
      ...newSubData,
      id: `subj-${Date.now()}`,
      totalMinutesStudied: 0,
    };
    setSubjects((prev) => [...prev, newSub]);
    setActiveSubjectId(newSub.id);
  };

  // Task actions
  const handleAddTask = (taskData: Omit<StudyTask, 'id' | 'createdAt' | 'completedPomodoros'>) => {
    const newTask: StudyTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      completedPomodoros: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStartFocusOnTask = (task: StudyTask) => {
    setActiveSubjectId(task.subjectId);
    setActiveTab('timer');
  };

  const handleSessionComplete = (minutes: number, subjectId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, totalMinutesStudied: s.totalMinutesStudied + minutes } : s
      )
    );

    setTasks((prev) => {
      let incremented = false;
      return prev.map((t) => {
        if (!incremented && t.subjectId === subjectId && !t.completed) {
          incremented = true;
          return { ...t, completedPomodoros: t.completedPomodoros + 1 };
        }
        return t;
      });
    });
  };

  const handleAskAIFromPdf = (selectedText: string, pageNum: number) => {
    setSelectedSnippetForChat(selectedText);
    setPendingPromptForChat(`Please explain this passage from Page ${pageNum} in depth:\n"${selectedText}"`);
    setIsChatOpen(true);
  };

  const handleTriggerQuizFromPdf = (topic: string, pageRange: string, textSnippet?: string) => {
    setQuizModalInitialTopic(topic);
    setQuizModalInitialPageRef(pageRange);
    setQuizModalInitialSnippet(textSnippet || '');
    setIsQuizModalOpen(true);
  };

  const handleQuizGenerated = (newQuiz: SavedQuiz) => {
    setQuizzes((prev) => [newQuiz, ...prev]);
    setActiveQuizSession(newQuiz);
  };

  const handleFinishQuiz = (completedQuiz: SavedQuiz) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === completedQuiz.id ? completedQuiz : q))
    );

    // If this was a collaborative quiz, submit score to group leaderboard
    if (completedQuiz.groupId && completedQuiz.score !== undefined) {
      collabSocket.submitQuizScore(completedQuiz.groupId, completedQuiz.score);
    }
  };

  const handleToggleBookmark = (page: number) => {
    if (!activeDoc) return;
    const isBookmarked = activeDoc.bookmarks.includes(page);
    const updatedBookmarks = isBookmarked
      ? activeDoc.bookmarks.filter((p) => p !== page)
      : [...activeDoc.bookmarks, page];

    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDoc!.id ? { ...d, bookmarks: updatedBookmarks } : d))
    );
  };

  const handleUploadCustomPdf = async (file: File) => {
    try {
      const fileName = file.name.replace(/\.pdf$/i, '');
      const blobUrl = URL.createObjectURL(file);

      const newDoc: StudyDocument = {
        id: `doc-custom-${Date.now()}`,
        subjectId: activeSubject.id,
        title: fileName,
        author: 'Uploaded Course Document',
        totalPages: 3,
        fileType: 'uploaded',
        fileDataUrl: blobUrl,
        uploadedAt: new Date().toISOString().split('T')[0],
        bookmarks: [],
        pages: [
          {
            pageNumber: 1,
            title: `${fileName} · Overview`,
            content: `Uploaded PDF File: "${file.name}" (${(file.size / 1024).toFixed(1)} KB).\n\nThis PDF is rendered live on screen with native viewing controls (zoom, scroll, print, page thumbnails) and direct download access.\n\nNerdify AI tutor has live visibility into this document to answer questions, explain concepts, and generate Quiz Buster assessment questions.`,
            keyTerms: [
              { term: 'Actual PDF File', definition: 'Rendered live on screen via native PDF engine.' },
              { term: 'Study Companion Ready', definition: 'Ask AI questions on the side or launch Quiz Buster.' },
            ],
          },
          {
            pageNumber: 2,
            title: `${fileName} · Content & Analytical Concepts`,
            content: `Section 2 of "${fileName}".\n\nStudy Checklist:\n• Review all diagrammatic figures and key proofs.\n• Use Quiz Buster to test active recall on definitions.\n• Start a 25-minute Pomodoro focus sprint.`,
          },
          {
            pageNumber: 3,
            title: `${fileName} · Summary & Practice Exercises`,
            content: `Concluding synthesis and review questions for "${fileName}".\n\nHigh-Yield Checklist:\n1. Ensure definitions can be explained in plain English using the Feynman technique.\n2. Complete a 5-question Quiz Buster drill with your study group.\n3. Run a 25-minute Pomodoro session to commit core points to memory.`,
          },
        ],
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      setCurrentPage(1);
      setActiveTab('reader');
    } catch (err) {
      console.error('PDF upload error:', err);
    }
  };

  // Collaborative Co-Create Quiz actions
  const handleOpenCoCreateQuiz = (existingQuiz?: CollaborativeQuiz) => {
    if (existingQuiz) {
      setActiveCoCreateQuiz(existingQuiz);
    } else {
      // Start a new collaborative quiz draft
      const newTitle = `${activeSubject.code} · ${activeDoc?.title.split(':')[0] || 'Group Practice'}`;
      collabSocket.startCoCreateQuiz(
        newTitle,
        activeDoc?.title || 'Course Material',
        `Page ${currentPage}`,
        []
      );
    }
  };

  const handleStartCollaborativeQuizSession = (cQuiz: CollaborativeQuiz) => {
    const convertedQuiz: SavedQuiz = {
      id: `quiz-collab-session-${Date.now()}`,
      subjectId: activeSubject.id,
      docId: activeDoc?.id,
      title: cQuiz.title,
      topic: cQuiz.topic,
      pageReference: cQuiz.pageReference,
      summary: `Collaborative Study Group Test (${cQuiz.questions.length} questions co-created by peers)`,
      questions: cQuiz.questions,
      totalQuestions: cQuiz.questions.length,
      createdAt: cQuiz.createdAt,
      isCollaborative: true,
      groupId: cQuiz.id,
    };

    setActiveCoCreateQuiz(null);
    setActiveQuizSession(convertedQuiz);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isChatOpen={isChatOpen}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setIsGroupOpen(false);
        }}
        isGroupOpen={isGroupOpen}
        onToggleGroup={() => {
          setIsGroupOpen(!isGroupOpen);
          if (!isGroupOpen) setIsChatOpen(false);
        }}
        peerCount={room.peers.length}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        activeSubjectCode={activeSubject?.code}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Tab 1: PDF Reader & Interactive Study Material */}
        {activeTab === 'reader' && (
          <PdfViewer
            document={activeDoc!}
            subject={activeSubject}
            currentPage={currentPage}
            onPageChange={(page) => {
              setCurrentPage(page);
            }}
            highlights={highlights}
            annotations={annotations}
            onAddHighlight={handleAddHighlight}
            onDeleteHighlight={handleDeleteHighlight}
            onUpdateHighlightNote={handleUpdateHighlightNote}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            onAskAI={handleAskAIFromPdf}
            onTriggerQuiz={handleTriggerQuizFromPdf}
            onUploadCustomPdf={handleUploadCustomPdf}
            onToggleBookmark={handleToggleBookmark}
            onShareViewWithGroup={handleShareViewWithGroup}
            isGroupConnected={room.peers.length > 0}
          />
        )}

        {/* Tab 2: Quiz Buster Hub */}
        {activeTab === 'quiz_buster' && (
          <QuizBusterView
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            onSubjectChange={handleSelectSubject}
            documents={documents}
            quizzes={quizzes}
            onOpenCreateModal={() => {
              setQuizModalInitialTopic(activeDoc?.pages[0]?.title || '');
              setQuizModalInitialPageRef(`Pages 1-${activeDoc?.totalPages || 5}`);
              setIsQuizModalOpen(true);
            }}
            onStartQuiz={(q) => setActiveQuizSession(q)}
          />
        )}

        {/* Tab 3: Pomodoro Focus Time Tracker */}
        {activeTab === 'timer' && (
          <PomodoroTracker
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            onSubjectChange={handleSelectSubject}
            onSessionComplete={handleSessionComplete}
          />
        )}

        {/* Tab 4: Subject Slots & To-Do List */}
        {activeTab === 'subjects' && (
          <SubjectSlotsView
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            onSelectSubject={handleSelectSubject}
            onAddSubject={handleAddSubject}
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            quizzes={quizzes}
            documents={documents}
            onOpenDocument={(docId) => {
              setActiveDocId(docId);
              setCurrentPage(1);
              setActiveTab('reader');
            }}
            onStartFocusOnTask={handleStartFocusOnTask}
          />
        )}

        {/* Collaborative Study Group Side Panel */}
        <StudyGroupPanel
          isOpen={isGroupOpen}
          onClose={() => setIsGroupOpen(false)}
          room={room}
          currentPeer={currentPeer}
          currentDoc={activeDoc!}
          currentPage={currentPage}
          onSendMessage={(content) =>
            collabSocket.sendChat(content, currentPeer.name, currentPeer.color)
          }
          onShareView={handleShareViewWithGroup}
          onJumpToSharedView={handleJumpToSharedView}
          onOpenInviteModal={() => setIsInviteModalOpen(true)}
          onOpenCoCreateQuiz={handleOpenCoCreateQuiz}
          onStartQuizSession={handleStartCollaborativeQuizSession}
        />

        {/* Inbuilt Side Chatbot ("Ask Nerdify AI Tutor") */}
        <AskNerdifyPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          document={activeDoc!}
          subject={activeSubject}
          currentPage={currentPage}
          selectedSnippet={selectedSnippetForChat}
          onClearSelectedSnippet={() => setSelectedSnippetForChat(undefined)}
          recentHighlights={highlights}
          onTriggerQuizFromContext={(topic, pageRef) =>
            handleTriggerQuizFromPdf(topic, pageRef)
          }
          pendingPrompt={pendingPromptForChat}
          onClearPendingPrompt={() => setPendingPromptForChat(undefined)}
        />
      </div>

      {/* Study Group Invite & Join Modal */}
      <StudyGroupModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        currentRoomId={room.id}
        roomName={room.name}
        peers={room.peers}
        userName={userName}
        userColor={userColor}
        onUpdateUserMeta={handleUpdateUserMeta}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        subjects={subjects}
      />

      {/* Collaborative Co-Create Quiz Workshop Modal */}
      {activeCoCreateQuiz && (
        <CoCreateQuizModal
          isOpen={!!activeCoCreateQuiz}
          onClose={() => setActiveCoCreateQuiz(null)}
          quiz={activeCoCreateQuiz}
          currentPeerName={currentPeer.name}
          onAddQuestion={(q) => collabSocket.addQuizQuestion(activeCoCreateQuiz.id, q)}
          onRequestAiQuestion={() => collabSocket.requestAiQuestion(activeCoCreateQuiz.id)}
          onLaunchQuiz={() => collabSocket.launchQuiz(activeCoCreateQuiz.id)}
          onStartQuizSession={handleStartCollaborativeQuizSession}
        />
      )}

      {/* Individual Quiz Buster Question Generator Modal */}
      <QuizBusterModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        subject={activeSubject}
        document={activeDoc!}
        initialTopic={quizModalInitialTopic}
        initialPageRef={quizModalInitialPageRef}
        initialSnippet={quizModalInitialSnippet}
        onQuizGenerated={handleQuizGenerated}
      />

      {/* Interactive Quiz Taking & Review Overlay */}
      {activeQuizSession && (
        <QuizTakingView
          quiz={activeQuizSession}
          subject={activeSubject}
          onFinishQuiz={handleFinishQuiz}
          onClose={() => setActiveQuizSession(null)}
        />
      )}
    </div>
  );
}
