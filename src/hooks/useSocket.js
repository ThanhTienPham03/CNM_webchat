import { useEffect, useCallback, useState } from 'react';
import socket from '../configs/socket';

export const useSocket = (conversationId) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  // Xử lý join room chat
  useEffect(() => {
    if (conversationId) {
      socket.emit('single chat', { conversation_id: conversationId });
    }
  }, [conversationId]);

  // Lắng nghe tin nhắn mới
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (message.conversation_id === conversationId) {
        console.log('New message received:', message);
        // Emit sự kiện đã nhận tin nhắn
        socket.emit('message received', {
          message_id: message.id,
          conversation_id: conversationId
        });
      }
    };

    const handleMessageUpdated = (updatedMessage) => {
      if (updatedMessage.conversation_id === conversationId) {
        console.log('Message updated:', updatedMessage);
      }
    };

    const handleTyping = (data) => {
      if (data.conversation_id === conversationId) {
        setTypingUser(data.user_id);
        setIsTyping(true);
        // Reset typing status after 3 seconds
        setTimeout(() => {
          setIsTyping(false);
          setTypingUser(null);
        }, 3000);
      }
    };

    const handleMessageSeen = (data) => {
      if (data.conversation_id === conversationId) {
        console.log('Message seen:', data);
      }
    };

    socket.on('new message', handleNewMessage);
    socket.on('message updated', handleMessageUpdated);
    socket.on('typing', handleTyping);
    socket.on('message seen', handleMessageSeen);

    return () => {
      socket.off('new message', handleNewMessage);
      socket.off('message updated', handleMessageUpdated);
      socket.off('typing', handleTyping);
      socket.off('message seen', handleMessageSeen);
    };
  }, [conversationId]);

  // Hàm gửi tin nhắn mới
  const sendMessage = useCallback((messageData) => {
    socket.emit('send message', messageData);
  }, []);

  // Hàm cập nhật tin nhắn
  const updateMessage = useCallback((messageData) => {
    socket.emit('update message', messageData);
  }, []);

  // Hàm gửi trạng thái đang gõ
  const sendTyping = useCallback(() => {
    if (conversationId) {
      socket.emit('typing', {
        conversation_id: conversationId
      });
    }
  }, [conversationId]);

  // Hàm gửi trạng thái đã xem
  const sendSeen = useCallback((messageId) => {
    if (conversationId && messageId) {
      socket.emit('message seen', {
        message_id: messageId,
        conversation_id: conversationId
      });
    }
  }, [conversationId]);

  return {
    socket,
    sendMessage,
    updateMessage,
    sendTyping,
    sendSeen,
    isTyping,
    typingUser
  };
}; 