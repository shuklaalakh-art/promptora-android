import { RemoteCommandType, RemoteSyncMessage, PlaybackState, PrompterSettings, Script } from '../types/teleprompter';

type MessageHandler = (message: RemoteSyncMessage) => void;

class RemoteSyncService {
  private roomId: string = '';
  private channel: BroadcastChannel | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private isPrompter: boolean = true;
  private heartbeatInterval: number | null = null;
  private lastPeerHeartbeat: number = 0;

  constructor() {
    this.initFromUrl();
  }

  public initFromUrl(): string {
    if (typeof window === 'undefined') return 'PROMPT-101';
    
    const params = new URLSearchParams(window.location.search);
    let room = params.get('room');
    if (!room) {
      // Check saved room or generate new PIN
      const saved = localStorage.getItem('teleprompter_room_id');
      if (saved) {
        room = saved;
      } else {
        const randomNum = Math.floor(100 + Math.random() * 900);
        room = `PROMPT-${randomNum}`;
        localStorage.setItem('teleprompter_room_id', room);
      }
    }
    
    this.setRoom(room);
    return room;
  }

  public setRoom(roomId: string) {
    if (this.roomId === roomId && this.channel) return;

    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // ignore
      }
    }

    this.roomId = roomId;
    localStorage.setItem('teleprompter_room_id', roomId);

    // Initialize BroadcastChannel
    try {
      this.channel = new BroadcastChannel(`teleprompter_sync_${roomId}`);
      this.channel.onmessage = (event: MessageEvent<RemoteSyncMessage>) => {
        if (event.data && event.data.roomId === this.roomId) {
          this.handleIncoming(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to storage events', e);
    }

    // Also listen to window storage events for wider compatibility
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === `teleprompter_sync_msg_${this.roomId}` && e.newValue) {
          try {
            const data: RemoteSyncMessage = JSON.parse(e.newValue);
            this.handleIncoming(data);
          } catch {
            // ignore JSON parse error
          }
        }
      });
    }

    this.startHeartbeat();
  }

  public setRole(isPrompter: boolean) {
    this.isPrompter = isPrompter;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private handleIncoming(message: RemoteSyncMessage) {
    // Update peer heartbeat
    this.lastPeerHeartbeat = Date.now();

    // Do not handle own messages if looped
    for (const listener of this.listeners) {
      listener(message);
    }
  }

  public sendCommand(command: RemoteCommandType, payload?: any) {
    const message: RemoteSyncMessage = {
      type: 'COMMAND',
      sender: this.isPrompter ? 'PROMPTER' : 'REMOTE',
      roomId: this.roomId,
      timestamp: Date.now(),
      command,
      payload,
    };
    this.broadcast(message);
  }

  public broadcastState(state: Partial<PlaybackState>) {
    const message: RemoteSyncMessage = {
      type: 'STATE_SYNC',
      sender: 'PROMPTER',
      roomId: this.roomId,
      timestamp: Date.now(),
      state,
    };
    this.broadcast(message);
  }

  public broadcastSettings(settings: Partial<PrompterSettings>) {
    const message: RemoteSyncMessage = {
      type: 'SETTINGS_SYNC',
      sender: this.isPrompter ? 'PROMPTER' : 'REMOTE',
      roomId: this.roomId,
      timestamp: Date.now(),
      settings,
    };
    this.broadcast(message);
  }

  public broadcastScript(script: Script) {
    const message: RemoteSyncMessage = {
      type: 'SETTINGS_SYNC',
      sender: this.isPrompter ? 'PROMPTER' : 'REMOTE',
      roomId: this.roomId,
      timestamp: Date.now(),
      script,
    };
    this.broadcast(message);
  }

  private broadcast(message: RemoteSyncMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // channel error
      }
    }

    // Fallback: write to localStorage to trigger storage event on other tabs
    try {
      localStorage.setItem(`teleprompter_sync_msg_${this.roomId}`, JSON.stringify(message));
    } catch {
      // ignore
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = window.setInterval(() => {
      const message: RemoteSyncMessage = {
        type: 'HEARTBEAT',
        sender: this.isPrompter ? 'PROMPTER' : 'REMOTE',
        roomId: this.roomId,
        timestamp: Date.now(),
      };
      this.broadcast(message);
    }, 4000);
  }

  public isPeerConnected(): boolean {
    return Date.now() - this.lastPeerHeartbeat < 10000;
  }

  public getPairingUrl(mode: 'remote' | 'prompter' = 'remote'): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?room=${this.roomId}&mode=${mode}`;
  }
}

export const remoteSync = new RemoteSyncService();
