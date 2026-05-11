'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let url = process.env.NEXT_PUBLIC_WS_URL;
    
    // Auto-detect hostname if running in browser to support local network testing
    // Only use auto-detected URL if NEXT_PUBLIC_WS_URL is not explicitly set
    if (typeof window !== 'undefined' && !url) {
      const hostname = window.location.hostname;
      url = `http://${hostname}:3001`;
    }
    
    // Fallback if still no URL
    if (!url) url = 'http://localhost:3001';

    socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function connectSocket(): Socket {
  return getSocket();
}
