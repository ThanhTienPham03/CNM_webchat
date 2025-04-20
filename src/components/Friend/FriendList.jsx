import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaUserPlus, FaUserClock, FaUserAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import { sendFriendRequest, acceptFriendRequest, getFriendRequests, searchUser } from '../../api/friendAPI';
import { createConversation } from '../../api/conversationAPI';
import { fetchUserDetail } from '../../api/userDetailsAPI';

const FriendList = ({ userId, accessToken }) => {
    // Thêm kiểm tra và thông báo lỗi chi tiết hơn
    if (!userId || typeof userId !== 'string' || !accessToken || typeof accessToken !== 'string') {
        console.error('UserId hoặc accessToken không hợp lệ. Vui lòng kiểm tra lại giá trị được truyền vào.');
        return (
            <div className="alert alert-danger">
                Lỗi: UserId hoặc accessToken không hợp lệ. Vui lòng đăng nhập lại.
            </div>
        );
    }

    const [friends, setFriends] = useState([]);
    const[userDetail, setUserDetail] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [addFriendMessages, setAddFriendMessages] = useState({});

    // Debounce tìm kiếm để giảm re-render
    const debouncedSetSearchTerm = useMemo(
        () => debounce((value) => setSearchTerm(value), 300),
        []
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/friends'); // Thay thế bằng API thực tế
            const data = await response.json();

            // Lấy thông tin chi tiết của từng bạn bè
            const detailedFriends = await Promise.all(
                data.map(async (friend) => {
                    const details = await fetchUserDetail(friend.user_id, accessToken);
                    return { ...friend, ...details };
                })
            );

            setFriends(detailedFriends);
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách bạn bè.');
            if (error.message?.includes('Phiên đăng nhập hết hạn')) {
                window.location.href = '/';
            }
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchRequests = useCallback(debounce(async () => {
        setLoading(true);
        try {
            const requests = await getFriendRequests();
            setFriendRequests(Array.isArray(requests) ? requests : []);
        } catch (error) {
            toast.error(error.message || 'Không thể tải yêu cầu kết bạn.');
            if (error.message?.includes('Phiên đăng nhập hết hạn')) {
                window.location.href = '/';
            }
        } finally {
            setLoading(false);
        }
    }, 300), []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const searchResults = useMemo(() => friends, [friends]);

    const handleAddFriend = useCallback(async (friendId) => {
        if (friends.some((friend) => friend.user_id === friendId)) {
            toast.error('Người này đã là bạn của bạn.');
            setAddFriendMessages((prev) => ({
                ...prev,
                [friendId]: 'Người này đã là bạn bè .',
            }));
            return;
        }
    
        try {
            await sendFriendRequest(friendId);
            toast.success('Gửi yêu cầu kết bạn thành công!');
            setAddFriendMessages((prev) => ({
                ...prev,
                [friendId]: 'Đã gửi yêu cầu kết bạn!',
            }));
            setFriends((prevFriends) => {
                return prevFriends.map((friend) =>
                    friend.user_id === friendId ? { ...friend, requestSent: true } : friend
                );
            });
        } catch (error) {
            const message = error.message || 'Không thể gửi yêu cầu kết bạn.';
            toast.error(message);
            setAddFriendMessages((prev) => ({
                ...prev,
                [friendId]: message,
            }));
            if (error.message?.includes('Phiên đăng nhập hết hạn')) {
                window.location.href = '/';
            }
        }
    }, [friends]);
    

    const handleAcceptRequest = useCallback(async (friendId) => {
        try {
            await acceptFriendRequest(friendId);
            toast.success('Đã chấp nhận yêu cầu kết bạn!');
            setFriendRequests((prev) => prev.filter((req) => req.id !== friendId));
            fetchData();

            const conversation = await createConversation(userId, friendId, accessToken);
            if (conversation) {
                toast.success('Cuộc trò chuyện mới đã được tạo!');
            }
        } catch (error) {
            toast.error(error.message || 'Không thể chấp nhận yêu cầu kết bạn.');
            if (error.message?.includes('Phiên đăng nhập hết hạn')) {
                window.location.href = '/';
            }
        }
    }, [fetchData, userId, accessToken]);

    const handleRejectRequest = useCallback(async (friendId) => {
        try {
            await sendFriendRequest(friendId, 'reject');
            toast.success('Đã từ chối yêu cầu kết bạn!');
            setFriendRequests((prev) => prev.filter((req) => req.id !== friendId));
        } catch (error) {
            toast.error(error.message || 'Không thể từ chối yêu cầu kết bạn.');
            if (error.message?.includes('Phiên đăng nhập hết hạn')) {
                window.location.href = '/';
            }
        }
    }, []);

    // Thay đổi logic tìm kiếm người dùng và xử lý kết quả
    const searchUser = async () => {
        if (!searchTerm.trim()) {
            toast.error('Vui lòng nhập email hoặc số điện thoại.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/users/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ keyword: searchTerm, id: userId }),
            });

            if (!response.ok) {
                throw new Error('Không thể tìm kiếm người dùng.');
            }

            const { users, userDetails } = await response.json();

            const combinedResults = users.map((user) => {
                const detail = userDetails.find((d) => d.user_id === user.id) || {};
                return { ...user, ...detail };
            });

            setFriends(combinedResults || []);
        } catch (error) {
            toast.error(error.message || 'Không thể tìm kiếm người dùng.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim()) {
            toast.error('Vui lòng nhập từ khóa tìm kiếm.');
            return;
        }

        setLoading(true);
        try {
            // Gọi API tìm kiếm người dùng
            const response = await searchUser(searchTerm, userId, accessToken);
            const { users, userDetails } = response;

            // Kết hợp thông tin người dùng và chi tiết
            const combinedResults = users.map((user) => {
                const detail = userDetails.find((d) => d.user_id === user.id) || {};
                return { ...user, ...detail };
            });

            setFriends(combinedResults || []);
        } catch (error) {
            toast.error(error.message || 'Không thể tìm kiếm người dùng.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, userId, accessToken]);

    const handleChatPress = useCallback(async (otherUserId, otherUserDetail) => {
        try {
            const conversations = await fetchConversationsByUserId(userId, accessToken);
            const conversation = conversations.find(conv =>
                Array.isArray(conv.participants) &&
                conv.participants.includes(otherUserId)
            );

            if (conversation) {
                toast.info('Chuyển đến màn hình chat.');
                // Điều hướng đến màn hình chat
                window.location.href = `/chat/${conversation.conversation_id}`;
            } else {
                toast.warn('Chưa có cuộc trò chuyện với người này.');
            }
        } catch (error) {
            toast.error('Không thể lấy thông tin cuộc trò chuyện.');
        }
    }, [userId, accessToken]);

    // Cải thiện giao diện hiển thị kết quả tìm kiếm
    const renderSearchResults = () => {
        if (!searchTerm.trim()) {
            return <p className="text-muted small mt-2">Vui lòng nhập từ khóa tìm kiếm.</p>;
        }

        if (friends.length === 0) {
            return <p className="text-muted small mt-2">Không tìm thấy người dùng.</p>;
        }

        console.log('Rendering search results with friends:', friends); // Debugging log

        return (
            <div className="search-results">
                {friends.map((result) => (
                        <div
                            key={result.id}
                            className="card mb-3 shadow-sm border-0 rounded d-flex align-items-center"
                            style={{ maxWidth: '540px', backgroundColor: '#ffffff', padding: '10px' }}
                        >
                            <div className="d-flex align-items-center w-100">
                                <img
                                    src={result.avatar_url || 'OIP.png'}
                                    alt={`Ảnh đại diện của ${result.name}`}
                                    className="img-fluid rounded-circle me-3"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                                <div className="d-flex flex-column flex-grow-1">
                                    <h5 className="mb-0 text-primary fw-bold">{result.fullname}</h5>
                                    {addFriendMessages[result.user_id] && (
                                        <small className="text-muted mt-1">{addFriendMessages[result.user_id]}</small>
                                    )}
                                </div>
                                {result.requestSent ? (
                                    <span className="text-success ms-3">Đã gửi lời mời</span>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-sm ms-3"
                                        onClick={() => handleAddFriend(result.user_id)}
                                    >
                                        Kết bạn
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f7f7f7' }}>
            {(error) && (
                <div className="alert alert-danger">{error}</div>
            )}
            {loading && <div className="text-center">Đang tải...</div>}

            {/* Thêm bạn mới */}
            <div className="mb-4 p-3 bg-white rounded shadow-sm">
                <h6 className="text-primary fw-bold mb-3 d-flex align-items-center">
                    <FaUserPlus className="me-2" /> Thêm bạn mới
                </h6>
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập email hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                    >
                        Tìm kiếm
                    </button>
                </div>
                {searchTerm && renderSearchResults()}
            </div>

            {/* Yêu cầu kết bạn */}
            <div className="mb-4 p-3 bg-white rounded shadow-sm">
                <h6 className="fw-bold text-secondary mb-2 d-flex align-items-center">
                    <FaUserClock className="me-2" /> Yêu cầu kết bạn
                </h6>
                {friendRequests.length === 0 ? (
                    <div className="text-muted small d-flex align-items-center gap-2 px-2">
                        <FaUserClock /> Chưa có yêu cầu kết bạn.
                    </div>
                ) : (
                    <ul className="list-group">
                        {friendRequests.map((request) => (
                            <li
                                key={request.id}
                                className="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <span>{request.name}</span>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleAcceptRequest(request.id)}
                                        aria-label={`Chấp nhận yêu cầu kết bạn từ ${request.name}`}
                                    >
                                        Chấp nhận
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleRejectRequest(request.id)}
                                        aria-label={`Từ chối yêu cầu kết bạn từ ${request.name}`}
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Thông tin bạn bè */}
            <div className="p-3 bg-white rounded shadow-sm">
                <h6 className="text-info fw-bold mb-2 d-flex align-items-center">
                    <FaUserAlt className="me-2" /> Thông tin bạn bè
                </h6>
                {selectedFriend ? (
                    <div className="small">
                        <p>
                            <strong>Tên:</strong> {selectedFriend.name}
                        </p>
                        <p>
                            <strong>Trạng thái:</strong>{' '}
                            {selectedFriend.status || 'Không có'}
                        </p>
                    </div>
                ) : (
                    <div className="text-muted small d-flex align-items-center gap-2 px-2">
                        <FaUserAlt /> Chọn một người bạn để xem chi tiết
                    </div>
                )}
            </div>
        </div>
    );
};

// Add default props to ensure `user` is defined
FriendList.defaultProps = {
    userId: {},
    accessToken: '',
};

export default FriendList;