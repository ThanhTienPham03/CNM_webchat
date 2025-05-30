import React, { useState, useEffect, useCallback } from 'react';
import { FaUserPlus, FaUserClock, FaUserAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import axios from 'axios';
import { searchUser } from '../../api/friendAPI';

import { API_URL } from '../../api/apiConfig';

const FriendList = ({ userId, accessToken, navigate, onConversationSelect }) => {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState(new Set());
    const [pendingRequests, setPendingRequests] = useState(new Set());
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friendRequestsDetails, setFriendRequestsDetails] = useState([]);
    const fetchUserDetail = async (userId, token) => {
        try {
            const res = await axios.get(`${API_URL}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        } catch (err) {
            console.error(`Lỗi khi lấy thông tin user ${userId}:`, err);
            return null;
        }
    };

    const fetchFriends = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/friends/${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            const friendIds = response.data.map((item) => item.friend_id);

            const friendDetails = await Promise.all(
                friendIds.map((id) => fetchUserDetail(id, accessToken))
            );

            const processedFriends = friendDetails.map((friend) => ({
                ...friend,
                fullname: friend.fullname || friend.UserDetail?.fullname || 'Tên không xác định',
                avatar_url: friend.avatar_url || friend.UserDetail?.avatar_url || 'OIP.png',
            }));

            console.log("Processed Friend Details:", processedFriends); 

            setFriends(processedFriends.filter(Boolean));
        } catch (error) {
            console.error("Lỗi lấy danh sách bạn bè:", error);
            alert("Không thể lấy danh sách bạn bè.");
        }
    };

    useEffect(() => {
        if (!userId) {
            console.error("userId is undefined or invalid.");
            setError("User ID không hợp lệ. Vui lòng đăng nhập lại.");
            return;
        }
        fetchFriends();
        fetchFriendRequests();
    }, [userId]);

    const handleSearch = useCallback(
        debounce(async () => {
            if (!keyword.trim()) {
                toast.error("Vui lòng nhập email hoặc số điện thoại.");
                return;
            }

            try {
                setLoading(true);
                const response = await searchUser(keyword);
                setResults(response);
            } catch (error) {
                console.error("Lỗi tìm kiếm người dùng:", error);
                toast.error("Không thể tìm kiếm người dùng.");
            } finally {
                setLoading(false);
            }
        }, 500),
        [keyword]
    );

    const acceptFriendRequest = async (friend_id) => {
        if (isNaN(userId) || isNaN(friend_id)) {
            console.error("Dữ liệu không hợp lệ: userId hoặc friend_id không phải là số.");
            toast.error("Dữ liệu không hợp lệ. Vui lòng thử lại.");
            return;
        }

        try {
            // Convert to numbers to ensure correct data type
            const numericUserId = Number(userId);
            const numericFriendId = Number(friend_id);

            console.log('Đang chấp nhận lời mời kết bạn:', {
                user_id: numericUserId,
                friend_id: numericFriendId
            });

            // Accept friend request
            const acceptResponse = await axios.post(
                `${API_URL}/api/friends/accept`,
                { 
                    user_id: numericUserId, 
                    friend_id: numericFriendId 
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    } 
                }
            );

            console.log('Kết quả chấp nhận kết bạn:', acceptResponse.data);

            // Create new conversation
            console.log('Đang tạo cuộc trò chuyện mới:', {
                participants: [numericUserId, numericFriendId]
            });

            const conversationResponse = await axios.post(
                `${API_URL}/api/conversations/add`,
                { 
                    participants: [numericUserId, numericFriendId]
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    } 
                }
            );

            console.log('Kết quả tạo cuộc trò chuyện:', conversationResponse.data);

            // Refresh data
            await Promise.all([
                fetchFriends(),
                fetchFriendRequests()
            ]);

            toast.success("Đã chấp nhận lời mời kết bạn thành công!");
        } catch (err) {
            console.error("Chi tiết lỗi khi chấp nhận kết bạn:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            
            const errorMessage = err.response?.data?.message || err.message || "Không thể chấp nhận yêu cầu kết bạn.";
            toast.error(errorMessage);
        }
    };

    const cancelFriendRequest = async (friend_id) => {
        try {
            await axios.post(`${API_URL}/api/friends/cancel-request`,
                { user_id: userId, friend_id },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            fetchFriendRequests();
        } catch (err) {
            console.error("Lỗi khi từ chối kết bạn", err);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            // Chuyển đổi userId sang number
            const numericUserId = Number(userId);
            console.log('Đang lấy danh sách lời mời kết bạn cho user:', numericUserId);
            
            // Lấy lời mời nhận được
            const receivedRes = await axios.get(`${API_URL}/api/friends/requests/${numericUserId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            
            console.log('Response lời mời nhận được:', {
                status: receivedRes.status,
                data: receivedRes.data
            });

            // Đảm bảo data là array và chuyển đổi friend_id sang number
            const receivedRequests = Array.isArray(receivedRes.data) 
                ? receivedRes.data.map(req => ({
                    ...req,
                    friend_id: Number(req.friend_id)
                }))
                : [];

            // Cập nhật state
            setFriendRequests(receivedRequests);
            
            // Lấy chi tiết người dùng cho lời mời nhận được
            if (receivedRequests.length > 0) {
                const detailsPromises = receivedRequests.map(async (request) => {
                    const userDetail = await fetchUserDetail(request.friend_id, accessToken);
                    return { ...request, userDetail };
                });

                const details = await Promise.all(detailsPromises);
                console.log('Chi tiết người dùng gửi lời mời:', details);
                setFriendRequestsDetails(details);
            } else {
                setFriendRequestsDetails([]);
            }

        } catch (err) {
            console.error("Chi tiết lỗi khi lấy lời mời kết bạn:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            toast.error("Không thể lấy danh sách lời mời kết bạn");
        }
    };

    const sendFriendRequest = async (friendId) => {
        try {
            const requestData = { 
                user_id: Number(userId), 
                friend_id: Number(friendId) 
            };
            console.log('Đang gửi lời mời kết bạn:', requestData);
            
            const response = await axios.post(
                `${API_URL}/api/friends/add`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            
            console.log('Response đầy đủ từ server:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });

            // Kiểm tra lỗi từ server
            if (response.data?.error) {
                console.error('Lỗi từ server:', response.data.error);
                toast.error(response.data.error);
                return;
            }

            // Kiểm tra message từ server
            if (response.data?.message) {
                console.log('Thông báo từ server:', response.data.message);
                toast.success(response.data.message);
                
                // Thêm vào danh sách đã gửi
                setSentRequests(prev => new Set([...prev, friendId]));
                setPendingRequests(prev => new Set([...prev, friendId]));
                
                // Kiểm tra ngay lập tức
                await checkFriendRequestStatus();
            }
        } catch (error) {
            console.error("Chi tiết lỗi:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // Hiển thị lỗi từ server hoặc lỗi mặc định
            const errorMessage = error.response?.data?.error || error.message || "Không thể gửi lời mời kết bạn.";
            toast.error(errorMessage);
        }
    };

    const checkFriendRequestStatus = async () => {
        try {
            console.log('Kiểm tra trạng thái lời mời kết bạn cho user:', userId);
            
            // Lấy danh sách lời mời nhận được
            const receivedRes = await axios.get(`${API_URL}/api/friends/requests/${userId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            
            console.log('Chi tiết response lời mời:', {
                status: receivedRes.status,
                data: receivedRes.data
            });

            // Kiểm tra cấu trúc dữ liệu
            if (Array.isArray(receivedRes.data)) {
                console.log('Phân tích danh sách lời mời:', receivedRes.data.map(req => ({
                    friend_id: req.friend_id,
                    status: req.status,
                    isSender: req.isSender,
                    created_at: req.created_at
                })));
            }

            // Cập nhật state nếu có dữ liệu mới
            const receivedRequests = Array.isArray(receivedRes.data) 
                ? receivedRes.data.filter(req => req.status === "PENDING" && !req.isSender)
                : [];

            console.log('Lời mời đang chờ xử lý:', receivedRequests);

            setFriendRequests(receivedRequests);
            
            if (receivedRequests.length > 0) {
                const detailsPromises = receivedRequests.map(async (request) => {
                    const userDetail = await fetchUserDetail(request.friend_id, accessToken);
                    return { ...request, userDetail };
                });

                const details = await Promise.all(detailsPromises);
                console.log('Chi tiết người dùng gửi lời mời:', details);
                setFriendRequestsDetails(details);
            } else {
                setFriendRequestsDetails([]);
            }
        } catch (err) {
            console.error("Chi tiết lỗi khi kiểm tra lời mời:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
        }
    };

    const handleChatPress = async (otherUserId, otherUserDetail) => {
        if (!otherUserId) {
            console.error('otherUserId không hợp lệ:', otherUserId);
            toast.error("Không thể xác định người dùng. Vui lòng thử lại.");
            return;
        }

        try {
            console.log('Bắt đầu xử lý handleChatPress với:', {
                currentUserId: userId,
                otherUserId: otherUserId,
                otherUserDetail: otherUserDetail,
                accessToken: accessToken ? 'Có token' : 'Không có token'
            });
            
            // Kiểm tra xem đã có conversation chưa
            console.log('Đang gọi API lấy danh sách conversations...');
            const conversations = await axios.get(
                `${API_URL}/api/conversations/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log('Kết quả API conversations:', {
                status: conversations.status,
                data: conversations.data
            });

            let conversation = null;
            if (Array.isArray(conversations.data)) {
                conversation = conversations.data.find(
                    (conv) => {
                        const hasParticipant = Array.isArray(conv.participants) && 
                            conv.participants.includes(Number(otherUserId));
                        console.log('Kiểm tra conversation:', {
                            convId: conv.conversation_id,
                            participants: conv.participants,
                            otherUserId: Number(otherUserId),
                            hasParticipant: hasParticipant
                        });
                        return hasParticipant && conv.type === 'SINGLE';
                    }
                );
            }

            // Nếu chưa có conversation, tạo mới
            if (!conversation) {
                console.log('Chưa có cuộc trò chuyện, đang tạo mới...');
                toast.info('Đang tạo cuộc trò chuyện mới...');
                
                const requestData = {
                    participants: [Number(userId), Number(otherUserId)],
                    type: 'SINGLE'
                };
                console.log('Dữ liệu gửi lên server để tạo conversation:', requestData);

                const response = await axios.post(
                    `${API_URL}/api/conversations/add`,
                    requestData,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                console.log('Kết quả tạo conversation mới:', {
                    status: response.status,
                    data: response.data
                });
                conversation = response.data;
                toast.success('Đã tạo cuộc trò chuyện mới!');
            }

            // Cập nhật selectedConversationId để hiển thị trong ChatBox
            if (conversation && conversation.conversation_id) {
                console.log('Đang chuyển đến cuộc trò chuyện:', {
                    conversationId: conversation.conversation_id,
                    hasCallback: !!onConversationSelect
                });
                if (onConversationSelect) {
                    onConversationSelect(conversation.conversation_id, otherUserDetail.fullname || 'Tên không xác định');
                    toast.success(`Đã mở cuộc trò chuyện với ${otherUserDetail.fullname || 'Tên không xác định'}`);
                } else {
                    console.error('Không có callback onConversationSelect');
                    toast.error('Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
                }
            } else {
                throw new Error('Không thể xác định conversation_id');
            }
        } catch (error) {
            console.error("Chi tiết lỗi khi xử lý cuộc trò chuyện:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                requestData: error.config?.data
            });
            toast.error(error.response?.data?.message || "Không thể mở cuộc trò chuyện. Vui lòng thử lại.");
        }
    };

    const renderSearchResults = () => {
        if (!results || results.length === 0) {
            return <div className="text-muted">Không tìm thấy người dùng nào.</div>;
        }

        return (
            <ul className="list-group">
                {results.map((user, index) => (
                    user?.user_id && (
                        <li key={`${user.user_id}-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <img
                                    src={user.avatar_url || "OIP.png"}
                                    alt="Avatar"
                                    className="rounded-circle me-2"
                                    style={{ width: "40px", height: "40px" }}
                                />
                                <strong className="text-primary ml-2">{user.fullname || "Tên không xác định"}</strong>
                            </div>
                            {pendingRequests.has(user.user_id) ? (
                                <span className="text-warning">
                                    <i className="fas fa-clock me-1"></i>
                                    Đã gửi lời mời - Đang chờ phản hồi
                                </span>
                            ) : sentRequests.has(user.user_id) ? (
                                <span className="text-muted">Đã gửi lời mời kết bạn!</span>
                            ) : (
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => sendFriendRequest(user.user_id)}
                                >
                                    Gửi kết bạn
                                </button>
                            )}
                        </li>
                    )
                ))}
            </ul>
        );
    };

    // Thêm useEffect để tự động cập nhật trạng thái lời mời
    useEffect(() => {
        const checkPendingRequests = async () => {
            const newPendingRequests = new Set();
            for (const friendId of pendingRequests) {
                try {
                    const res = await axios.get(`${API_URL}/api/friends/requests/${userId}`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    
                    if (Array.isArray(res.data)) {
                        const isPending = res.data.some(request => 
                            request.user_id === friendId && request.status === 'pending'
                        );
                        if (isPending) {
                            newPendingRequests.add(friendId);
                        }
                    }
                } catch (error) {
                    console.error('Lỗi khi kiểm tra trạng thái:', error);
                }
            }
            setPendingRequests(newPendingRequests);
        };

        if (pendingRequests.size > 0) {
            const interval = setInterval(checkPendingRequests, 10000);
            return () => clearInterval(interval);
        }
    }, [pendingRequests, userId, accessToken]);

    // Thêm useEffect để tự động cập nhật trạng thái
    useEffect(() => {
        if (userId) {
            // Kiểm tra ngay khi component mount
            checkFriendRequestStatus();
            
            // Tự động refresh mỗi 10 giây
            const interval = setInterval(checkFriendRequestStatus, 10000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f7f7f7' }}>
            {error && <div className="alert alert-danger">{error}</div>}
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
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        <i className="bi bi-search"></i>
                    </button>
                </div>
                {renderSearchResults()}
            </div>

            {/* Yêu cầu kết bạn */}
            <div className="mb-4 p-3 bg-white rounded shadow-sm">
                <h6 className="fw-bold text-secondary mb-2 d-flex align-items-center">
                    <FaUserClock className="me-2" /> Yêu cầu kết bạn
                </h6>
                {friendRequestsDetails.length === 0 ? (
                    <div className="text-muted small d-flex align-items-center gap-2 px-2">
                        <FaUserClock /> Chưa có yêu cầu kết bạn.
                    </div>
                ) : (
                    <ul className="list-group">
                        {friendRequestsDetails.map((request) => (
                            <li key={request.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <img
                                        src={request.userDetail?.avatar_url || 'OIP.png'}
                                        alt="Avatar"
                                        className="rounded-circle me-2"
                                        style={{ width: '32px', height: '32px' }}
                                    />
                                    <div>
                                        <div>
                                            {request.userDetail?.fullname
                                                || request.userDetail?.username
                                                || request.userDetail?.email
                                                || request.friend_id
                                                || 'Ẩn danh'}
                                        </div>
                                        {request.userDetail?.email && (
                                            <div className="text-muted small">{request.userDetail.email}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => acceptFriendRequest(request.friend_id)}
                                    >
                                        Chấp nhận
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => cancelFriendRequest(request.friend_id)}
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
                {friends.length === 0 ? (
                    <div className="text-muted small d-flex align-items-center gap-2 px-2">
                        <FaUserAlt /> Bạn chưa có bạn bè nào.
                    </div>
                ) : (
                    <ul className="list-group">
                        {friends.map((userDetail, index) => (
                            <li key={`${userDetail?.id || index}-${userDetail?.fullname || index}`} className="list-group-item d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <img
                                        src={userDetail?.avatar_url || 'OIP.png'}
                                        alt="Avatar"
                                        className="rounded-circle me-2"
                                        style={{ width: '40px', height: '40px' }}
                                    />
                                    <span className="fw-bold">{userDetail?.fullname || 'Tên không xác định'}</span>
                                </div>
                                <button
                                    className="btn btn-sm btn-info"
                                    onClick={() => {
                                        console.log('Click vào nút nhắn tin với user:', userDetail);
                                        // Sử dụng user_id thay vì id
                                        const otherUserId = userDetail?.user_id || userDetail?.id;
                                        if (!otherUserId) {
                                            console.error('Không tìm thấy ID của người dùng:', userDetail);
                                            toast.error("Không thể xác định người dùng. Vui lòng thử lại.");
                                            return;
                                        }
                                        handleChatPress(otherUserId, userDetail);
                                    }}
                                >
                                    Nhắn tin
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

FriendList.defaultProps = {
    userId: '',
    accessToken: '',
};

export default FriendList;
