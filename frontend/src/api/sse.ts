export class SSEManager {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private eventHandlers: Map<string, (e: MessageEvent) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    if (this.eventSource) {
      return;
    }
    this.eventSource = new EventSource('/api/sse/events');

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.dispatch('message', data);
      } catch {
        this.dispatch('message', event.data);
      }
    };

    this.eventSource.addEventListener('ping', (e) => {
      this.dispatch('ping', (e as MessageEvent).data);
    });

    this.eventSource.addEventListener('heartbeat', (e) => {
      this.dispatch('heartbeat', (e as MessageEvent).data);
    });

    // Re-attach custom event listeners when reconnecting
    this.eventHandlers.forEach((handler, eventType) => {
      this.eventSource?.addEventListener(eventType, handler as EventListener);
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts = 0;
          this.connect();
        }, delay);
      }
    };

  }

  private dispatch(eventType: string, data: unknown): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
    const allCallbacks = this.listeners.get('*');
    if (allCallbacks) {
      allCallbacks.forEach((cb) => cb(data));
    }
  }

  on(eventType: string, callback: (data: unknown) => void): void {
    let callbacks = this.listeners.get(eventType);
    if (!callbacks) {
      callbacks = new Set();
      this.listeners.set(eventType, callbacks);
    }
    callbacks.add(callback);

    // Add EventSource listener for custom event types (e.g. orchestration_complete)
    if (!['message', 'ping', 'heartbeat'].includes(eventType) && !this.eventHandlers.has(eventType)) {
      const handler = (e: MessageEvent) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          this.dispatch(eventType, data);
        } catch {
          this.dispatch(eventType, e.data);
        }
      };
      this.eventHandlers.set(eventType, handler);
      this.eventSource?.addEventListener(eventType, handler as EventListener);
    }
  }

  off(eventType: string, callback: (data: unknown) => void): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.eventSource?.close();
    this.eventSource = null;
    this.listeners.clear();
    this.eventHandlers.clear();
  }
}

export const sseManager = new SSEManager();
