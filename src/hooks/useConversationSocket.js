import { useEffect, useCallback } from 'react';
import socket from '../configs/socket';

export const useConversationSocket = (userId, setConversations) => {
  // Hàm sắp xếp conversations
  const sortConversations = useCallback((conversations) => {
    return [...conversations].sort((a, b) => {
      const timeA = a.lastMessage?.updated_at || a.lastMessage?.created_at || '';
      const timeB = b.lastMessage?.updated_at || b.lastMessage?.created_at || '';
      return new Date(timeB) - new Date(timeA);
    });
  }, []);

  // Xử lý cập nhật tin nhắn cuối cùng
  const handleLastMessageUpdate = useCallback((data) => {
    const { conversation_id, message } = data;
    
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === conversation_id) {
          return {
            ...conv,
            lastMessage: {
              ...message,
              content: message.content,
              updated_at: message.created_at || new Date().toISOString()
            }
          };
        }
        return conv;
      });
      
      // Sắp xếp lại conversations sau khi cập nhật
      return sortConversations(updatedConversations);
    });
  }, [sortConversations]);

  // Xử lý tin nhắn bị thu hồi
  const handleMessageRevoked = useCallback((data) => {
    const { conversation_id, message_id } = data;
    
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === conversation_id && conv.lastMessage?.id === message_id) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              content: "Tin nhắn đã bị thu hồi",
              status: "REVOKED",
              updated_at: new Date().toISOString()
            }
          };
        }
        return conv;
      });
      
      // Sắp xếp lại conversations sau khi cập nhật
      return sortConversations(updatedConversations);
    });
  }, [sortConversations]);

  // Xử lý tin nhắn bị xóa
  const handleMessageDeleted = useCallback((data) => {
    const { conversation_id, message_id } = data;
    
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === conversation_id && conv.lastMessage?.id === message_id) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              content: "Tin nhắn đã bị xóa",
              status: "DELETED",
              updated_at: new Date().toISOString()
            }
          };
        }
        return conv;
      });
      
      // Sắp xếp lại conversations sau khi cập nhật
      return sortConversations(updatedConversations);
    });
  }, [sortConversations]);

  useEffect(() => {
    if (!userId) return;

    const handleConnect = () => {
      console.log('Connected to socket server');
      // Khi kết nối lại, join lại vào tất cả các conversations
      setConversations(prev => {
        prev.forEach(conv => {
          socket.emit('join conversation', { conversation_id: conv.id });
        });
        return prev;
      });
    };

    const handleDisconnect = () => {
      console.log('Disconnected from socket server');
    };

    // Lắng nghe sự kiện kết nối
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Lắng nghe sự kiện tin nhắn mới
    socket.on('new message', handleLastMessageUpdate);
    
    // Lắng nghe sự kiện tin nhắn bị thu hồi
    socket.on('message revoked', handleMessageRevoked);
    
    // Lắng nghe sự kiện tin nhắn bị xóa
    socket.on('message deleted', handleMessageDeleted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new message', handleLastMessageUpdate);
      socket.off('message revoked', handleMessageRevoked);
      socket.off('message deleted', handleMessageDeleted);
    };
  }, [userId, handleLastMessageUpdate, handleMessageRevoked, handleMessageDeleted]);

  return {
    socket,
    sortConversations
  };
}; 