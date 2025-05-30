import { io } from 'socket.io-client';
import { API_BASE_URL,API_URL } from '../api/apiConfig'; // Đường dẫn đến tệp cấu hình API của bạn

const socket = io(`${API_URL}`, {

  autoConnect: true,
  withCredentials: true,
  transports: ['websocket'],
  cors: {
    origin: `${API_BASE_URL}:5173`,
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