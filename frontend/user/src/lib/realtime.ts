import { useGameStore } from '@/store/gameStore';

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
        const relevantEvents = [
          'ATTENDANCE_CHECK_IN',
          'ATTENDANCE_CHECK_OUT',
          'XP_AWARDED',
          'SCORE_SUBMITTED',
          'LEADERBOARD_UPDATED',
          'GAME_SESSION_COMPLETED',
        ];

        if (relevantEvents.includes(eventType)) {
          const gameStore = useGameStore();
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
