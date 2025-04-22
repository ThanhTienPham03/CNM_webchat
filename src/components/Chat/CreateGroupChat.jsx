import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupChatAPI from '../../api/groupChatAPI';
import { getFriends } from '../../api/friendAPI';
import { fetchUserDetail } from '../../api/userDetailsAPI';
import { Container, Form, Button, ListGroup, Image, Alert } from 'react-bootstrap';

const CreateGroupChat = ({ userId, accessToken, onClose }) => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const MIN_MEMBERS = 2; // Số thành viên tối thiểu (không tính người tạo)

  useEffect(() => {
    const fetchFriendsWithDetails = async () => {
      try {
        const friendsData = await getFriends(userId);
        
        // Lấy thông tin chi tiết của từng người bạn
        const friendsWithDetails = await Promise.all(
          friendsData.map(async (friend) => {
            try {
              const details = await fetchUserDetail(friend.friend_id, accessToken);
              return {
                ...friend,
                ...details,
                fullname: details.fullname || 'Người dùng',
                avatar_url: details.avatar_url || '/default-avatar.png'
              };
            } catch (err) {
              console.error(`Error fetching details for friend ${friend.friend_id}:`, err);
              return {
                ...friend,
                fullname: 'Người dùng',
                avatar_url: '/default-avatar.png'
              };
            }
          })
        );

        setFriends(friendsWithDetails);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsWithDetails();
  }, [userId, accessToken]);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra điều kiện tạo nhóm
    if (!groupName.trim()) {
      setError('Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedUsers.length < MIN_MEMBERS) {
      setError(`Vui lòng chọn ít nhất ${MIN_MEMBERS} thành viên để tạo nhóm chat`);
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Log để kiểm tra
      console.log('User ID (creator):', userId);
      console.log('Selected users:', selectedUsers);

      // Tạo object chứa thông tin nhóm
      const groupData = {
        group_name: groupName.trim(),
        type: 'GROUP',
        status: 'ACTIVE',
        participants: [...selectedUsers, Number(userId)].map(id => Number(id))
      };

      // Log để kiểm tra dữ liệu
      console.log('Group data being sent:', groupData);

      const response = await GroupChatAPI.createGroup(groupData, new FormData(), accessToken);
      
      // Log response từ API
      console.log('API Response:', response);

      // Kiểm tra response chi tiết hơn
      if (!response) {
        throw new Error('Không nhận được phản hồi từ server');
      }

      if (!response.conversation_id) {
        console.error('Response structure:', response);
        throw new Error('Thiếu conversation_id trong phản hồi');
      }

      // Thông báo thành công và chuyển hướng
      if (onClose) {
        onClose();
      }
      navigate(`/home`);
    } catch (err) {
      console.error('Error creating group:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo nhóm chat');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  const remainingMembers = MIN_MEMBERS - selectedUsers.length;

  return (
    <Container>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Tên nhóm</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tên nhóm..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>
            Chọn thành viên từ danh sách bạn bè ({friends.length})
          </Form.Label>
          <div className="mb-2 text-muted small">
            <i className="bi bi-info-circle me-1"></i>
            Bạn sẽ là nhóm trưởng của nhóm chat này
          </div>
          {remainingMembers > 0 && (
            <div className="mb-2 text-warning">
              <i className="bi bi-exclamation-circle me-1"></i>
              Vui lòng chọn thêm ít nhất {remainingMembers} thành viên nữa
            </div>
          )}
          <ListGroup className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {friends.map(friend => (
              <ListGroup.Item 
                key={friend.friend_id} 
                className="d-flex align-items-center py-2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleUserSelect(friend.friend_id)}
              >
                <Form.Check
                  type="checkbox"
                  id={`user-${friend.friend_id}`}
                  checked={selectedUsers.includes(friend.friend_id)}
                  onChange={() => handleUserSelect(friend.friend_id)}
                  className="me-3"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="d-flex align-items-center flex-grow-1">
                  <div className="position-relative">
                    <Image
                      src={friend.avatar_url}
                      alt={friend.fullname}
                      roundedCircle
                      width={48}
                      height={48}
                      className="me-3"
                      style={{ objectFit: 'cover' }}
                    />
                    {selectedUsers.includes(friend.friend_id) && (
                      <div 
                        className="position-absolute" 
                        style={{ 
                          bottom: -3, 
                          right: 8,
                          backgroundColor: '#198754',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-check-lg text-white" style={{ fontSize: '12px' }}></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <h6 className="mb-0">{friend.fullname}</h6>
                    {friend.email && (
                      <small className="text-muted">{friend.email}</small>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
          {friends.length === 0 && (
            <Alert variant="info">
              Bạn chưa có người bạn nào. Hãy kết bạn trước khi tạo nhóm chat.
            </Alert>
          )}
          {friends.length === 1 && (
            <Alert variant="warning">
              Bạn cần có ít nhất {MIN_MEMBERS} người bạn để tạo nhóm chat.
            </Alert>
          )}
        </Form.Group>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={creating}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={selectedUsers.length < MIN_MEMBERS || !groupName.trim() || creating}
          >
            {creating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang tạo nhóm...
              </>
            ) : (
              <>
                Tạo nhóm ({selectedUsers.length}/{MIN_MEMBERS}+ thành viên)
              </>
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default CreateGroupChat; 