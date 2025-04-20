import React, { useEffect, useState, useCallback } from 'react';
import ConversationApi from '../../api/conversationAPI';
import { fetchUserDetail } from '../../api/userDetailsAPI';

const ChatList = ({ userId, accessToken, onConversationSelect }) => {
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);

  const getListConversation = useCallback(async () => {
    if (!userId || !accessToken) {
      console.error('Thiếu userId hoặc accessToken');
      return;
    }
  
    try {
      const data = await ConversationApi.fetchConversationsByUserId(userId, accessToken);
      console.log('Dữ liệu trả về từ API:', data); // Log toàn bộ dữ liệu trả về
  
      if (data) {
        const detailsPromises = data.map(async (conv) => {
          console.log('name:', conv.name); // Log giá trị name
  
          // Tách participants từ name
          const participants = conv.name ? conv.name.split(',').map((id) => id.trim()) : [];
          console.log('participants:', participants); // Log danh sách participants
  
          // Xác định otherUserId
          const otherUserId = participants.find((id) => id !== String(userId));
          console.log('otherUserId:', otherUserId); // Log giá trị otherUserId
  
          let otherUserDetail = null;
          if (otherUserId) {
            try {
              otherUserDetail = await fetchUserDetail(otherUserId, accessToken);
              console.log('Thông tin người dùng:', otherUserDetail); // Log thông tin trả về từ API
            } catch (err) {
              console.error(`Không thể lấy thông tin người dùng với ID: ${otherUserId}`, err);
            }
          }
  
          return {
            ...conv,
            otherUserDetail,
          };
        });
  
        const details = await Promise.all(detailsPromises);
        console.log('Danh sách chi tiết cuộc trò chuyện:', details); // Log danh sách chi tiết
        setConversations(details);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', err);
      setError('Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại sau.');
    }
  }, [userId, accessToken]);

  useEffect(() => {
    console.log('Fetching conversations for user:', userId);
    getListConversation();
  }, [getListConversation]);

  useEffect(() => {
    console.log('Danh sách cuộc trò chuyện:', conversations);
  }, [conversations]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log('Refreshing conversations for user:', userId);
  //     getListConversation();
  //   }, 5000); // Refresh every 5 seconds

  //   return () => clearInterval(interval);
  // }, [getListConversation]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="text-danger" style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>Không có cuộc trò chuyện nào.</p>
      </div>
    );
  }

  return (
    <ul className="list-group">
      {conversations.map((item, index) => {
        console.log('Render item:', item); // Kiểm tra từng phần tử
        console.log('lastMessage:', item.lastMessage); // Kiểm tra lastMessage
  
        if (!item.id) {
          console.error('Thiếu thuộc tính id cho item:', item);
          return null;
        }
  
        const avatarUrl = item.otherUserDetail?.avatar_url || '/OIP.png';
        const fullname = item.otherUserDetail?.fullname || `Cuộc trò chuyện ${index + 1}`;
        const lastMessage = item.lastMessage || 'Chưa có tin nhắn'; // Lấy nội dung tin nhắn cuối cùng
        const time = formatTime(item.lastMessage?.updated_at);
  
        return (
          <li
            key={item.id}
            className="list-group-item d-flex align-items-center conversation-item p-3"
            onClick={() => onConversationSelect(item.id, fullname)}
            style={{
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              marginBottom: '0.5rem',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="rounded-circle me-3 border border-primary"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center">
                <strong className="text-primary fs-5">{fullname}</strong>
                <small className="text-muted">{time}</small>
              </div>
              <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.95rem' }}>
                {lastMessage} {/* Hiển thị nội dung tin nhắn cuối cùng */}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ChatList;