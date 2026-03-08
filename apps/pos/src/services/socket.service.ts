import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

class SocketService {
  private sockets: Map<string, Socket> = new Map();

  connect(namespace: string): Socket {
    if (this.sockets.has(namespace)) {
      return this.sockets.get(namespace)!;
    }

    const token = useAuthStore.getState().accessToken;
    const socket = io(`/${namespace}`, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log(`Connected to /${namespace}`);
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected from /${namespace}`);
    });

    socket.on('connect_error', (err) => {
      console.warn(`Socket /${namespace} connection failed:`, err.message);
    });

    this.sockets.set(namespace, socket);
    return socket;
  }

  getSocket(namespace: string): Socket | undefined {
    return this.sockets.get(namespace);
  }

  disconnect(namespace: string) {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(namespace);
    }
  }

  disconnectAll() {
    this.sockets.forEach((socket) => socket.disconnect());
    this.sockets.clear();
  }
}

export const socketService = new SocketService();
