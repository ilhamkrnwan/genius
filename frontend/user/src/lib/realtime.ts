import { useGameStore } from '@/store/gameStore';
import { useGameSessionStore } from '@/store/gameSessionStore';

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let isRealtimeStarted = false;

function getWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3001/ws';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const targetPort = window.location.port === '3000' ? '3001' : (window.location.port || '3001');
  const wsBase = `${protocol}//${host}:${targetPort}/ws`;
  const token = localStorage.getItem('genius_user_token');
  return token ? `${wsBase}?token=${encodeURIComponent(token)}` : wsBase;
}

export function initUserRealtime() {
  if (typeof window === 'undefined') return;
  if (isRealtimeStarted && socket && socket.readyState === WebSocket.OPEN) return;
  isRealtimeStarted = true;

  connect();
}

function connect() {
  if (typeof window === 'undefined') return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const url = getWsUrl();
    socket = new WebSocket(url);

    socket.onopen = () => {
      // Subscribe to global and user topics
      try {
        socket?.send(JSON.stringify({ action: 'SUBSCRIBE', topic: 'leaderboard:global' }));
        socket?.send(JSON.stringify({ action: 'SUBSCRIBE', topic: 'announcements:global' }));
        
        const rawUser = localStorage.getItem('genius_user');
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            if (parsed?.teamId) {
              socket?.send(JSON.stringify({ action: 'SUBSCRIBE', topic: `team:${parsed.teamId}` }));
            }
          } catch (_) {}
        }
      } catch (_) {}

      // Keepalive ping every 25 seconds
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      keepAliveTimer = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ action: 'PING' }));
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'PONG') return;

        const eventType = msg.event || msg.data?.type;

        // 1. Session-specific real-time events (Pause, Start/Resume, Expire/Stop)
        if (
          eventType === 'SESSION_PAUSED' ||
          eventType === 'GAME_SESSION_PAUSED'
        ) {
          const sessionStore = useGameSessionStore();
          sessionStore.handleSessionPaused(msg.data);
          return;
        }

        if (
          eventType === 'SESSION_STARTED' ||
          eventType === 'GAME_SESSION_STARTED'
        ) {
          const sessionStore = useGameSessionStore();
          sessionStore.handleSessionStarted(msg.data);
          return;
        }

        if (
          eventType === 'SESSION_EXPIRED' ||
          eventType === 'GAME_SESSION_EXPIRED'
        ) {
          const sessionStore = useGameSessionStore();
          sessionStore.handleSessionExpired(msg.data);
          return;
        }

        if (
          eventType === 'SESSION_COMPLETED' ||
          eventType === 'GAME_SESSION_COMPLETED'
        ) {
          const sessionStore = useGameSessionStore();
          sessionStore.handleSessionCompleted(msg.data);
          const gameStore = useGameStore();
          void gameStore.syncWithServer();
          return;
        }

        // 2. Global state and attendance sync events
        const relevantEvents = [
          'ATTENDANCE_CHECK_IN',
          'ATTENDANCE_CHECK_OUT',
          'XP_AWARDED',
          'SCORE_SUBMITTED',
          'LEADERBOARD_UPDATED',
          'SYSTEM_SETTINGS_UPDATED',
          'XP_RESET',
        ];

        if (relevantEvents.includes(eventType)) {
          const gameStore = useGameStore();
          const payload = msg.data?.settings || msg.data;
          if (payload?.activeDay) {
            gameStore.activeDay = Number(payload.activeDay) as 1 | 2 | 3;
          }
          // Immediately sync updated XP, stamps, and attendance status from database
          void gameStore.syncWithServer();
          void gameStore.syncAttendanceFromServer();
        }
      } catch (_) {
        // ignore parse errors
      }
    };

    socket.onclose = () => {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 3000);
    };

    socket.onerror = () => {
      try {
        socket?.close();
      } catch (_) {}
    };
  } catch (_) {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 5000);
  }
}
