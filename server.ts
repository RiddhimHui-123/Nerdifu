import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODEL_NAME = 'gemini-3.8-flash';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: !!process.env.GEMINI_API_KEY,
    appName: 'Nerdify',
  });
});

// -------------------------------------------------------------
// Real-time Collaborative Study Group Server State
// -------------------------------------------------------------

interface StudyPeer {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  currentDocId?: string;
  currentPage?: number;
  joinedAt: string;
}

interface GroupChatMessage {
  id: string;
  peerId: string;
  peerName: string;
  peerColor: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'system' | 'view_share' | 'quiz_invite';
  sharedView?: {
    docId: string;
    docTitle: string;
    page: number;
    snippet?: string;
  };
  quizData?: {
    quizId: string;
    title: string;
    questionCount: number;
  };
}

interface SharedView {
  docId: string;
  docTitle: string;
  page: number;
  sharedBy: string;
  snippet?: string;
  timestamp: string;
}

interface CollaborativeQuiz {
  id: string;
  roomId: string;
  title: string;
  topic: string;
  pageReference: string;
  createdBy: string;
  questions: any[];
  status: 'drafting' | 'active' | 'completed';
  scores: Record<string, { peerName: string; score: number; completedAt: string }>;
  createdAt: string;
}

interface StudyRoomState {
  id: string;
  name: string;
  subjectId: string;
  hostId: string;
  peers: StudyPeer[];
  messages: GroupChatMessage[];
  sharedView: SharedView | null;
  annotations: any[];
  highlights: any[];
  quizzes: CollaborativeQuiz[];
}

// Authoritative in-memory store for study rooms
const studyRooms = new Map<string, StudyRoomState>();

// Pre-seed an active group study room so users can jump right in or test immediately!
studyRooms.set('BIO-CIRCLES-101', {
  id: 'BIO-CIRCLES-101',
  name: 'Cellular Respiration Prep Circle',
  subjectId: 'subj-bio',
  hostId: 'peer-seed-1',
  peers: [
    {
      id: 'peer-seed-1',
      name: 'Maya Chen',
      color: '#06b6d4',
      isHost: true,
      currentDocId: 'doc-bio-1',
      currentPage: 3,
      joinedAt: '10:15 AM',
    },
    {
      id: 'peer-seed-2',
      name: 'Liam Davis',
      color: '#10b981',
      isHost: false,
      currentDocId: 'doc-bio-1',
      currentPage: 3,
      joinedAt: '10:18 AM',
    },
  ],
  messages: [
    {
      id: 'msg-seed-1',
      peerId: 'peer-seed-1',
      peerName: 'Maya Chen',
      peerColor: '#06b6d4',
      content: 'Welcome everyone! We are prepping Chapter 9: Cellular Respiration & ATP synthase rotary motors today.',
      timestamp: '10:15 AM',
      type: 'chat',
    },
    {
      id: 'msg-seed-2',
      peerId: 'peer-seed-2',
      peerName: 'Liam Davis',
      peerColor: '#10b981',
      content: 'I shared my screen view to Page 3 (Citric Acid Cycle outputs). Look at the oxaloacetate regeneration steps!',
      timestamp: '10:20 AM',
      type: 'chat',
    },
    {
      id: 'msg-seed-3',
      peerId: 'peer-seed-1',
      peerName: 'Maya Chen',
      peerColor: '#06b6d4',
      content: 'I also drafted 2 practice questions for our group quiz test! Feel free to add more or ask Nerdify AI to suggest one.',
      timestamp: '10:22 AM',
      type: 'chat',
    },
  ],
  sharedView: {
    docId: 'doc-bio-1',
    docTitle: 'Cellular Respiration & ATP Chemiosmosis (Ch. 9)',
    page: 3,
    sharedBy: 'Maya Chen',
    snippet: 'The acetyl group of acetyl CoA enters the cycle by combining with the 4-carbon compound oxaloacetate to form 6-carbon citrate.',
    timestamp: '10:20 AM',
  },
  annotations: [
    {
      id: 'ann-collab-1',
      docId: 'doc-bio-1',
      page: 3,
      x: 72,
      y: 40,
      content: 'Maya: Crucial exam formula! 6 NADH + 2 FADH2 + 2 ATP per glucose.',
      color: '#06b6d4',
      authorId: 'peer-seed-1',
      authorName: 'Maya Chen',
      authorColor: '#06b6d4',
      createdAt: '2026-11-10',
    },
  ],
  highlights: [
    {
      id: 'hl-collab-1',
      docId: 'doc-bio-1',
      page: 3,
      text: 'The acetyl group of acetyl CoA enters the cycle by combining with the 4-carbon compound oxaloacetate to form 6-carbon citrate.',
      color: 'blue',
      note: 'Shared by Liam: Oxaloacetate is the regenerated 4C substrate.',
      authorId: 'peer-seed-2',
      authorName: 'Liam Davis',
      authorColor: '#10b981',
      createdAt: '2026-11-10',
    },
  ],
  quizzes: [
    {
      id: 'cquiz-1',
      roomId: 'BIO-CIRCLES-101',
      title: 'Krebs Cycle & Redox Group Sprint',
      topic: 'Citric Acid Cycle & Oxidative Phosphorylation',
      pageReference: 'Pages 3-4',
      createdBy: 'Maya Chen',
      status: 'drafting',
      scores: {},
      createdAt: '2026-11-10',
      questions: [
        {
          id: 'cq-1',
          type: 'multiple_choice',
          question: 'What 4-carbon molecule condenses with Acetyl-CoA at the entry step of the citric acid cycle?',
          options: ['Malate', 'Oxaloacetate', 'Succinate', 'Citrate'],
          correctAnswer: 'Oxaloacetate',
          explanation: 'Oxaloacetate (4 carbons) condenses with Acetyl-CoA (2 carbons) to form Citrate (6 carbons).',
          contributedBy: 'Maya Chen',
        },
        {
          id: 'cq-2',
          type: 'true_false',
          question: 'Complex II of the electron transport chain directly pumps protons across the inner mitochondrial membrane.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'Complex II (succinate dehydrogenase) accepts electrons from FADH2 but does NOT pump protons directly.',
          contributedBy: 'Liam Davis',
        },
      ],
    },
  ],
});

// Map of active client connection to session meta
const clientMetadata = new Map<WebSocket, { roomId: string; peerId: string; peerName: string }>();

// Broadcast helper for rooms
function broadcastToRoom(roomId: string, messageObj: any, excludeWs?: WebSocket) {
  const jsonStr = JSON.stringify(messageObj);
  for (const [ws, meta] of clientMetadata.entries()) {
    if (meta.roomId === roomId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(jsonStr);
    }
  }
}

// -------------------------------------------------------------
// Gemini API Chat & Quiz Routes
// -------------------------------------------------------------

app.post('/api/chat/stream', async (req, res) => {
  const { messages, context, mode } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    if (!process.env.GEMINI_API_KEY) {
      res.write(`data: ${JSON.stringify({ text: "⚠️ Gemini API key is missing. Please configure GEMINI_API_KEY in the Secrets panel to activate Nerdify's AI Tutor." })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    let modeInstruction = "You are Nerdify, an enthusiastic, brilliant, encouraging, and highly articulate agentic AI study buddy and tutor.";
    if (mode === 'socratic') {
      modeInstruction += " You use the Socratic method: guide the student by asking thoughtful questions, testing their reasoning, and scaffolding their thinking step by step rather than just giving away the final answer.";
    } else if (mode === 'feynman') {
      modeInstruction += " You use the Feynman Technique: explain complex ideas using simple, vivid, everyday analogies, plain English, and intuitive examples as if teaching a smart 12-year-old.";
    } else if (mode === 'exam') {
      modeInstruction += " You are in Strict Exam Drill mode: challenge the student with practice questions, point out common misconceptions, test definitions, and prepare them for exam traps.";
    } else if (mode === 'summarizer') {
      modeInstruction += " You are in High-Yield Summary mode: produce bulleted key concepts, core formulas, definitions, and high-yield takeaways with zero fluff.";
    }

    let documentContext = "";
    if (context) {
      documentContext = `\n\n--- CURRENT STUDY CONTEXT ---\nSubject: ${context.subject || 'General Studies'}\nDocument: ${context.docTitle || 'Study Material'}\nCurrent Page: ${context.pageNum || 1} of ${context.totalPages || 1}`;
      if (context.selectedSnippet) {
        documentContext += `\nSelected / Highlighted Text from user:\n"${context.selectedSnippet}"\n`;
      }
      if (context.pageContent) {
        documentContext += `\nFull content of current page (${context.pageNum}):\n"""${context.pageContent.slice(0, 4000)}"""\n`;
      }
    }

    const systemInstruction = `${modeInstruction}\nYou have direct visibility into the student's open textbook / study PDF and their current page.\nAlways ground your explanations in the provided page text when relevant. Format using clean Markdown with bolding, concise bullet points, and code/math blocks where helpful.\n${documentContext}`;

    const formattedContents: any[] = [];
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        formattedContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: "Hello! Help me understand this study material." }],
      });
    }

    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: formattedContents,
      config: { systemInstruction },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to generate response' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key is not configured in environment variables." });
    }

    const systemInstruction = `You are Nerdify, an agentic AI study buddy. Context: ${JSON.stringify(context || {})}`;
    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: formattedContents,
      config: { systemInstruction },
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to complete chat' });
  }
});

app.post('/api/quiz/generate', async (req, res) => {
  try {
    const {
      subject,
      docTitle,
      topic,
      pageNumbers,
      sourceText,
      count = 5,
      difficulty = 'medium',
      questionTypes = ['multiple_choice', 'true_false', 'short_answer'],
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "Gemini API key is required to generate custom quizzes with Quiz Buster.",
      });
    }

    const prompt = `You are Quiz Buster, the intelligent test and assessment generator within Nerdify.
Generate exactly ${count} high-quality test questions based on the following study material and parameters:

Subject: ${subject || 'General'}
Document Title: ${docTitle || 'Study Notes'}
Topic/Target Concepts: ${topic || 'Key concepts covered in this section'}
Target Page Reference: ${pageNumbers || 'Current chapter'}
Difficulty Level: ${difficulty}
Allowed Question Types: ${questionTypes.join(', ')}

Source Material:
"""${(sourceText || '').slice(0, 8000)}"""`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            pageReference: { type: Type.STRING },
            summary: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['id', 'type', 'question', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['title', 'topic', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Quiz Buster error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

app.post('/api/explain', async (req, res) => {
  try {
    const { text, context, type = 'explain' } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key is required." });
    }

    const prompt = `As Nerdify AI Study Buddy, analyze this excerpt from page ${context?.pageNum || 1} of "${context?.docTitle || 'Textbook'}":
"${text}"
Task: ${type === 'feynman' ? 'Explain using the Feynman technique (crystal clear everyday analogy, no jargon).' : 'Provide 2-sentence intuitive breakdown, why it matters, and 2 key bullet points to memorize.'}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Explain error:', error);
    res.status(500).json({ error: error.message || 'Failed to explain snippet' });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to HTTP server on /ws
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const { type, payload } = data;

      switch (type) {
        case 'room:join': {
          const { roomId, userName, userColor, currentDocId, currentPage } = payload;
          const peerId = `peer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

          let room = studyRooms.get(roomId);
          if (!room) {
            room = {
              id: roomId,
              name: `Study Group · ${roomId}`,
              subjectId: 'subj-bio',
              hostId: peerId,
              peers: [],
              messages: [],
              sharedView: null,
              annotations: [],
              highlights: [],
              quizzes: [],
            };
            studyRooms.set(roomId, room);
          }

          const newPeer: StudyPeer = {
            id: peerId,
            name: userName || 'Study Buddy',
            color: userColor || '#6366f1',
            isHost: room.peers.length === 0,
            currentDocId,
            currentPage,
            joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          room.peers = [...room.peers.filter((p) => p.id !== peerId), newPeer];
          clientMetadata.set(ws, { roomId, peerId, peerName: newPeer.name });

          // Add system join message
          const joinMsg: GroupChatMessage = {
            id: `sys-${Date.now()}`,
            peerId: 'system',
            peerName: 'System',
            peerColor: '#94a3b8',
            content: `${newPeer.name} joined the study session! 👋`,
            timestamp: newPeer.joinedAt,
            type: 'system',
          };
          room.messages.push(joinMsg);

          // Send authoritative initial room state to newly joined client
          ws.send(
            JSON.stringify({
              type: 'room:init',
              payload: {
                currentPeer: newPeer,
                room,
              },
            })
          );

          // Broadcast peer join and system message to everyone else in the room
          broadcastToRoom(
            roomId,
            {
              type: 'peer:joined',
              payload: { peer: newPeer, message: joinMsg },
            },
            ws
          );
          break;
        }

        case 'chat:send': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const chatMsg: GroupChatMessage = {
            id: `msg-${Date.now()}`,
            peerId: meta.peerId,
            peerName: payload.peerName || meta.peerName,
            peerColor: payload.peerColor || '#6366f1',
            content: payload.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: payload.type || 'chat',
            sharedView: payload.sharedView,
            quizData: payload.quizData,
          };

          room.messages.push(chatMsg);
          broadcastToRoom(meta.roomId, {
            type: 'chat:message',
            payload: chatMsg,
          });
          break;
        }

        case 'view:share': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const sharedView: SharedView = {
            docId: payload.docId,
            docTitle: payload.docTitle,
            page: payload.page,
            sharedBy: meta.peerName,
            snippet: payload.snippet,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          room.sharedView = sharedView;

          // Add chat announcement
          const viewMsg: GroupChatMessage = {
            id: `msg-view-${Date.now()}`,
            peerId: meta.peerId,
            peerName: meta.peerName,
            peerColor: payload.peerColor || '#6366f1',
            content: `shared view to **Page ${payload.page}** of "${payload.docTitle}"`,
            timestamp: sharedView.timestamp,
            type: 'view_share',
            sharedView: {
              docId: payload.docId,
              docTitle: payload.docTitle,
              page: payload.page,
              snippet: payload.snippet,
            },
          };
          room.messages.push(viewMsg);

          broadcastToRoom(meta.roomId, {
            type: 'view:updated',
            payload: { sharedView, message: viewMsg },
          });
          break;
        }

        case 'annotation:create': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const newAnn = {
            ...payload.annotation,
            id: payload.annotation.id || `ann-collab-${Date.now()}`,
            authorId: meta.peerId,
            authorName: meta.peerName,
            createdAt: new Date().toISOString().split('T')[0],
          };

          // Guard against duplicates (idempotency)
          if (!room.annotations.some((a) => a.id === newAnn.id)) {
            room.annotations.push(newAnn);
          }

          broadcastToRoom(meta.roomId, {
            type: 'annotation:created',
            payload: newAnn,
          });
          break;
        }

        case 'annotation:delete': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          room.annotations = room.annotations.filter((a) => a.id !== payload.annotationId);
          broadcastToRoom(meta.roomId, {
            type: 'annotation:deleted',
            payload: { annotationId: payload.annotationId },
          });
          break;
        }

        case 'highlight:create': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const newHl = {
            ...payload.highlight,
            id: payload.highlight.id || `hl-collab-${Date.now()}`,
            authorId: meta.peerId,
            authorName: meta.peerName,
            createdAt: new Date().toISOString().split('T')[0],
          };

          if (!room.highlights.some((h) => h.id === newHl.id)) {
            room.highlights.push(newHl);
          }

          broadcastToRoom(meta.roomId, {
            type: 'highlight:created',
            payload: newHl,
          });
          break;
        }

        case 'highlight:delete': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          room.highlights = room.highlights.filter((h) => h.id !== payload.highlightId);
          broadcastToRoom(meta.roomId, {
            type: 'highlight:deleted',
            payload: { highlightId: payload.highlightId },
          });
          break;
        }

        case 'quiz:co_create_start': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const newQuiz: CollaborativeQuiz = {
            id: `cquiz-${Date.now()}`,
            roomId: meta.roomId,
            title: payload.title || 'Collaborative Study Sprint',
            topic: payload.topic || 'General Chapter Review',
            pageReference: payload.pageReference || 'Pages 1-5',
            createdBy: meta.peerName,
            status: 'drafting',
            questions: payload.initialQuestions || [],
            scores: {},
            createdAt: new Date().toISOString().split('T')[0],
          };

          room.quizzes.push(newQuiz);

          const draftMsg: GroupChatMessage = {
            id: `msg-quiz-${Date.now()}`,
            peerId: meta.peerId,
            peerName: meta.peerName,
            peerColor: payload.peerColor || '#6366f1',
            content: `started co-creating a collaborative quiz: **"${newQuiz.title}"**! Jump in to draft questions.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'quiz_invite',
            quizData: {
              quizId: newQuiz.id,
              title: newQuiz.title,
              questionCount: newQuiz.questions.length,
            },
          };
          room.messages.push(draftMsg);

          broadcastToRoom(meta.roomId, {
            type: 'quiz:updated',
            payload: { quiz: newQuiz, message: draftMsg },
          });
          break;
        }

        case 'quiz:add_question': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const targetQuiz = room.quizzes.find((q) => q.id === payload.quizId);
          if (targetQuiz) {
            const questionWithAuthor = {
              ...payload.question,
              id: payload.question.id || `cq-${Date.now()}`,
              contributedBy: meta.peerName,
            };
            targetQuiz.questions.push(questionWithAuthor);

            broadcastToRoom(meta.roomId, {
              type: 'quiz:updated',
              payload: { quiz: targetQuiz },
            });
          }
          break;
        }

        case 'quiz:ai_assist_question': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const targetQuiz = room.quizzes.find((q) => q.id === payload.quizId);
          if (targetQuiz && process.env.GEMINI_API_KEY) {
            try {
              const aiPrompt = `Generate 1 challenging, high-yield multiple-choice exam question based on this study topic: "${targetQuiz.topic}" and page context: "${targetQuiz.pageReference}". Provide 4 options, correct answer, and explanation.`;
              const aiRes = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: aiPrompt,
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctAnswer', 'explanation'],
                  },
                },
              });

              const parsedQ = JSON.parse(aiRes.text || '{}');
              const aiQuestion = {
                id: `cq-ai-${Date.now()}`,
                type: 'multiple_choice',
                question: parsedQ.question,
                options: parsedQ.options,
                correctAnswer: parsedQ.correctAnswer,
                explanation: parsedQ.explanation,
                contributedBy: 'Nerdify AI',
              };

              targetQuiz.questions.push(aiQuestion);

              broadcastToRoom(meta.roomId, {
                type: 'quiz:updated',
                payload: { quiz: targetQuiz },
              });
            } catch (e) {
              console.error('AI question generation error:', e);
            }
          }
          break;
        }

        case 'quiz:launch': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const targetQuiz = room.quizzes.find((q) => q.id === payload.quizId);
          if (targetQuiz) {
            targetQuiz.status = 'active';

            const launchMsg: GroupChatMessage = {
              id: `msg-launch-${Date.now()}`,
              peerId: meta.peerId,
              peerName: meta.peerName,
              peerColor: '#f59e0b',
              content: `🚀 **Group Test Launched!** "${targetQuiz.title}" is now live (${targetQuiz.questions.length} questions). Take it together!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'quiz_invite',
              quizData: {
                quizId: targetQuiz.id,
                title: targetQuiz.title,
                questionCount: targetQuiz.questions.length,
              },
            };
            room.messages.push(launchMsg);

            broadcastToRoom(meta.roomId, {
              type: 'quiz:launched',
              payload: { quiz: targetQuiz, message: launchMsg },
            });
          }
          break;
        }

        case 'quiz:submit_score': {
          const meta = clientMetadata.get(ws);
          if (!meta) return;
          const room = studyRooms.get(meta.roomId);
          if (!room) return;

          const targetQuiz = room.quizzes.find((q) => q.id === payload.quizId);
          if (targetQuiz) {
            targetQuiz.scores[meta.peerId] = {
              peerName: meta.peerName,
              score: payload.score,
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            const scoreMsg: GroupChatMessage = {
              id: `msg-score-${Date.now()}`,
              peerId: 'system',
              peerName: 'System',
              peerColor: '#10b981',
              content: `🏆 ${meta.peerName} scored **${payload.score}%** on "${targetQuiz.title}"!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'system',
            };
            room.messages.push(scoreMsg);

            broadcastToRoom(meta.roomId, {
              type: 'quiz:score_updated',
              payload: { quiz: targetQuiz, message: scoreMsg },
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    const meta = clientMetadata.get(ws);
    if (meta) {
      const room = studyRooms.get(meta.roomId);
      if (room) {
        room.peers = room.peers.filter((p) => p.id !== meta.peerId);
        const leaveMsg: GroupChatMessage = {
          id: `sys-leave-${Date.now()}`,
          peerId: 'system',
          peerName: 'System',
          peerColor: '#94a3b8',
          content: `${meta.peerName} left the session.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'system',
        };
        room.messages.push(leaveMsg);

        broadcastToRoom(meta.roomId, {
          type: 'peer:left',
          payload: { peerId: meta.peerId, peerName: meta.peerName, message: leaveMsg },
        });
      }
      clientMetadata.delete(ws);
    }
  });
});

// Express Vite mounting logic
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Nerdify full-stack server with WebSockets running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
