import React, { useEffect, useState, useCallback } from 'react';
import ConversationApi from '../../api/conversationAPI';
import { fetchUserDetail } from '../../api/userDetailsAPI';
import { useConversationSocket } from '../../hooks/useConversationSocket';

const ChatList = ({ userId, accessToken, onConversationSelect }) => {
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sử dụng hook useConversationSocket
  const { socket, sortConversations } = useConversationSocket(userId, setConversations);

  const getListConversation = useCallback(async () => {
    if (!userId || !accessToken) {
      console.error('Thiếu userId hoặc accessToken');
      return;
    }

    try {
      setLoading(true);
      const data = await ConversationApi.fetchConversationsByUserId(userId, accessToken);
      console.log("Received conversation data:", data); // Log để debug
      
      if (data) {
        const detailsPromises = data.map(async (conv) => {
          // Nếu là nhóm chat
          if (conv.isGroup) {
            // Lấy thông tin của tất cả thành viên trong nhóm
            const memberDetailsPromises = conv.participants.map(async (participantId) => {
              try {
                const memberDetail = await fetchUserDetail(participantId, accessToken);
                return {
                  id: participantId,
                  fullname: memberDetail.fullname || 'Chưa cập nhật tên',
                  avatar_url: memberDetail.avatar_url || '/OIP.png',
                  status: memberDetail.status || 'OFFLINE'
                };
              } catch (err) {
                console.error(`Error fetching member details for ${participantId}:`, err);
                return {
                  id: participantId,
                  fullname: 'Người dùng không tồn tại',
                  avatar_url: '/OIP.png'
                };
              }
            });

            const memberDetails = await Promise.all(memberDetailsPromises);
            
            // Join conversation room
            socket.emit('join conversation', { conversation_id: conv.id });

            return {
              ...conv,
              memberDetails,
              displayName: conv.name || 'Nhóm chat',
              memberNames: memberDetails.map(m => m.fullname).join(', ')
            };
          }

          // Nếu là chat 1-1
          const otherUserId = conv.participants.find(id => id !== String(userId));
          
          if (!otherUserId) {
            return {
              ...conv,
              otherUserDetail: null,
              displayName: 'Cuộc trò chuyện không hợp lệ'
            };
          }

          try {
            const otherUserDetail = await fetchUserDetail(otherUserId, accessToken);
            
            // Join conversation room
            socket.emit('join conversation', { conversation_id: conv.id });

            return {
              ...conv,
              otherUserDetail: {
                ...otherUserDetail,
                fullname: otherUserDetail.fullname || 'Chưa cập nhật tên',
                avatar_url: otherUserDetail.avatar_url || '/OIP.png',
                status: otherUserDetail.status || 'OFFLINE'
              },
              displayName: otherUserDetail.fullname || 'Chưa cập nhật tên'
            };
          } catch (err) {
            console.error('Error fetching user details:', err);
            return {
              ...conv,
              otherUserDetail: null,
              displayName: 'Người dùng không tồn tại'
            };
          }
        });

        const details = await Promise.all(detailsPromises);
        console.log("Processed conversations:", details); // Log để debug
        
        // Sắp xếp conversations theo thời gian tin nhắn cuối cùng
        const sortedConversations = sortConversations(details);
        setConversations(sortedConversations);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', err);
      setError('Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, socket, sortConversations]);

  useEffect(() => {
    getListConversation();
  }, [getListConversation]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    // Nếu thời gian nhỏ hơn 1 phút
    if (diff < 60 * 1000) {
      return 'Vừa xong';
    }
    
    // Nếu thời gian nhỏ hơn 1 giờ, hiển thị số phút
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} phút trước`;
    }
    
    // Nếu thời gian nhỏ hơn 24 giờ, hiển thị số giờ
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} giờ trước`;
    }
    
    // Nếu trong năm hiện tại, hiển thị ngày và tháng
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('vi-VN', {
        month: '2-digit',
        day: '2-digit'
      });
    }
    
    // Nếu khác năm, hiển thị đầy đủ ngày tháng năm
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="conversation-list-container">
      {error && (
        <div className="text-danger" style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Không có cuộc trò chuyện nào.</p>
        </div>
      ) : (
        <div className="conversation-list" style={{
          height: 'calc(100vh - 120px)',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          <ul className="list-group">
            {conversations.map((item) => {
              if (!item.id) return null;

              const avatarUrl = item.isGroup 
                ? '/OIP.png'  // Mặc định avatar cho nhóm
                : (item.otherUserDetail?.avatar_url || '/OIP.png');
              
              const fullname = item.isGroup
                ? (item.name || 'Nhóm chat')
                : item.displayName;
              
              const subtitle = item.isGroup
                ? `Thành viên: ${item.memberNames}`
                : null;
              const lastMessageContent = typeof item.lastMessage === 'object' && item.lastMessage !== null
                ? item.lastMessage.content || 'Chưa có tin nhắn'
                : item.lastMessage || 'Chưa có tin nhắn';
              const time = formatTime(item.lastMessage?.updated_at || item.lastMessage?.created_at);

              return (
                <li
                  key={item.id}
                  className="list-group-item d-flex align-items-center conversation-item p-3"
                  onClick={() => onConversationSelect(item.id, fullname)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    backgroundColor: 'white',
                    transform: 'translateX(0)',
                    opacity: 1,
                    animation: item.isNew ? 'slideIn 0.3s ease' : 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <div className="position-relative">
                    <img
                      src={avatarUrl}
                      alt={item.isGroup ? "Group Avatar" : "User Avatar"}
                      className="rounded-circle me-3 border border-primary"
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        objectFit: 'cover',
                        backgroundColor: '#e9ecef' // Thêm màu nền cho avatar
                      }}
                      onError={(e) => {
                        e.target.onerror = null; // Tránh lặp vô hạn
                        e.target.src = item.isGroup ? '/group-avatar.png' : '/OIP.png';
                      }}
                    />
                    {!item.isGroup && (
                      <span
                        className="position-absolute"
                        style={{
                          bottom: 4,
                          right: 12,
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          border: '2px solid white',
                          backgroundColor: (item.otherUserDetail?.status === 'ONLINE') ? '#28a745' : '#adb5bd',
                          display: 'block'
                        }}
                        title={item.otherUserDetail?.status === 'ONLINE' ? 'Online' : 'Offline'}
                      />
                    )}
                    {item.isGroup && (
                      <div 
                        className="position-absolute"
                        style={{
                          bottom: -2,
                          right: 8,
                          backgroundColor: '#0d6efd',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white'
                        }}
                      >
                        <i className="bi bi-people-fill text-white" style={{ fontSize: '12px' }}></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="text-primary fs-5">{fullname}</strong>
                      <small className="text-muted">{time}</small>
                    </div>
                    {subtitle && (
                      <small className="text-muted d-block">{subtitle}</small>
                    )}
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.95rem' }}>
                      {lastMessageContent}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatList;