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
      if (data) {
        const detailsPromises = data.map(async (conv) => {
          const participants = conv.name ? conv.name.split(',').map((id) => id.trim()) : [];
          const otherUserId = participants.find((id) => id !== String(userId));

          let otherUserDetail = null;
          if (otherUserId) {
            try {
              otherUserDetail = await fetchUserDetail(otherUserId, accessToken);
              if ( !otherUserDetail.isFriend) {
                // console.warn(`Người dùng với ID: ${otherUserId} chưa là bạn bè.`);
                otherUserDetail = { fullname: otherUserDetail.fullname, avatar_url: otherUserDetail.avatar_url }; // Gán thông tin mặc định
              }
            } catch (err) {
              if (err.message === 'User detail not found.') {
                console.warn(`Người dùng với ID: ${otherUserId} không tồn tại. Gán thông tin mặc định.`);
                otherUserDetail = { fullname: 'Người dùng không tồn tại', avatar_url: null }; // Gán thông tin mặc định
              } else {
                console.error(`Không thể lấy thông tin người dùng với ID: ${otherUserId}`, err);
                otherUserDetail = { fullname: 'Lỗi khi lấy thông tin', avatar_url: null }; // Gán thông tin lỗi
              }
            }
          }

          return {
            ...conv,
            otherUserDetail,
          };
        });
        const details = await Promise.all(detailsPromises);
        const filteredDetails = details.map((item) => {
          if (!item || !item.otherUserDetail) {
            return {
              ...item,
              otherUserDetail: {
                fullname: 'Người dùng không tồn tại',
                avatar_url: '/OIP.png',
              },
            };
          } else if (item.otherUserDetail && !item.otherUserDetail.isFriend) {
            console.warn(`Người dùng với ID: ${item.otherUserDetail.id} chưa kết bạn.`);
            return {
              ...item,
              otherUserDetail: {
                ...item.otherUserDetail,
                fullname: `${item.otherUserDetail.fullname}`
              },
            };
          } else if (item.otherUserDetail) {
            return {
              ...item,
              otherUserDetail: {
                ...item.otherUserDetail,
                fullname: item.otherUserDetail.fullname || 'Tên không xác định',
                avatar_url: item.otherUserDetail.avatar_url || '/OIP.png',
              },
            };
          }
          return item; 
        });
        setConversations(filteredDetails);
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
        const lastMessageContent = typeof item.lastMessage === 'object' && item.lastMessage !== null
          ? item.lastMessage.content || 'Chưa có tin nhắn'
          : item.lastMessage || 'Chưa có tin nhắn';
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
                {lastMessageContent} 
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ChatList;