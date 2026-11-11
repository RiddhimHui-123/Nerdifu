/**
 * Client-side WebSocket client for real-time collaborative study groups.
 * Handles auto-reconnect, event subscriptions, and optimistic updates.
 */

type EventHandler = (payload: any) => void;

class CollabSocketClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private isConnecting = false;
  private reconnectTimeout: any = null;
  private currentRoomId: string | null = null;
  private currentUserMeta: { name: string; color: string } | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return resolve();
      }

      this.isConnecting = true;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          // If we had an active room before disconnect, re-join seamlessly!
          if (this.currentRoomId && this.currentUserMeta) {
            this.send('room:join', {
              roomId: this.currentRoomId,
              userName: this.currentUserMeta.name,
              userColor: this.currentUserMeta.color,
            });
          }
          this.emitInternal('connection:change', { status: 'connected' });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type) {
              this.emitInternal(data.type, data.payload);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.emitInternal('connection:change', { status: 'disconnected' });
          this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
          this.isConnecting = false;
          console.warn('WebSocket connection error:', err);
        };
      } catch (err) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentRoomId) {
        this.connect().catch(() => {});
      }
    }, 2500);
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  private emitInternal(event: string, payload: any) {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((h) => {
        try {
          h(payload);
        } catch (e) {
          console.error(`Error in event handler for ${event}:`, e);
        }
      });
    }
  }

  send(type: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect().then(() => {
        this.ws?.send(JSON.stringify({ type, payload }));
      });
      return;
    }
    this.ws.send(JSON.stringify({ type, payload }));
  }

  // High level collaborative actions
  joinRoom(roomId: string, userName: string, userColor: string, currentDocId?: string, currentPage?: number) {
    this.currentRoomId = roomId;
    this.currentUserMeta = { name: userName, color: userColor };
    this.send('room:join', { roomId, userName, userColor, currentDocId, currentPage });
  }

  sendChat(content: string, peerName?: string, peerColor?: string) {
    this.send('chat:send', { content, peerName, peerColor });
  }

  shareView(docId: string, docTitle: string, page: number, snippet?: string, peerColor?: string) {
    this.send('view:share', { docId, docTitle, page, snippet, peerColor });
  }

  createAnnotation(annotation: any) {
    this.send('annotation:create', { annotation });
  }

  deleteAnnotation(annotationId: string) {
    this.send('annotation:delete', { annotationId });
  }

  createHighlight(highlight: any) {
    this.send('highlight:create', { highlight });
  }

  deleteHighlight(highlightId: string) {
    this.send('highlight:delete', { highlightId });
  }

  startCoCreateQuiz(title: string, topic: string, pageReference: string, initialQuestions?: any[]) {
    this.send('quiz:co_create_start', { title, topic, pageReference, initialQuestions });
  }

  addQuizQuestion(quizId: string, question: any) {
    this.send('quiz:add_question', { quizId, question });
  }

  requestAiQuestion(quizId: string) {
    this.send('quiz:ai_assist_question', { quizId });
  }

  launchQuiz(quizId: string) {
    this.send('quiz:launch', { quizId });
  }

  submitQuizScore(quizId: string, score: number) {
    this.send('quiz:submit_score', { quizId, score });
  }
}

export const collabSocket = new CollabSocketClient();
