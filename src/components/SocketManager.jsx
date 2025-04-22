import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../configs/socket';

const SocketManager = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Xử lý kết nối socket
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    // Xử lý ngắt kết nối socket
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    // Xử lý lỗi kết nối
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Nếu lỗi xác thực, chuyển hướng về trang đăng nhập
      if (error.message.includes('authentication')) {
        navigate('/login');
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [navigate]);

  return null; 
};

export default SocketManager; 