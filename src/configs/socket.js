import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket'],
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

export default socket; 