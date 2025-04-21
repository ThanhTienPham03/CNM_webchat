import React, { useState, useEffect, useCallback } from 'react';
import { FaUserPlus, FaUserClock, FaUserAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import axios from 'axios';
import { searchUser } from '../../api/friendAPI';

const FriendList = ({ userId, accessToken, navigate }) => {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friendRequestsDetails, setFriendRequestsDetails] = useState([]);
    const API_URL = "http://localhost:3000";

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

            console.log("Processed Friend Details:", processedFriends); // Log dữ liệu đã xử lý

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
            await axios.post(`${API_URL}/api/friends/accept`,
                { user_id: userId, friend_id },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            fetchFriends();
            fetchFriendRequests();
        } catch (err) {
            console.error("Lỗi khi chấp nhận kết bạn", err);
            toast.error("Không thể chấp nhận yêu cầu kết bạn. Vui lòng thử lại.");
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
            const res = await axios.get(`${API_URL}/api/friends/requests/${userId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            setFriendRequests(res.data);

            const detailsPromises = res.data.map(async (request) => {
                const userDetail = await fetchUserDetail(request.user_id, accessToken);
                return { ...request, userDetail };
            });

            const details = await Promise.all(detailsPromises);
            setFriendRequestsDetails(details);
        } catch (err) {
            console.error("Lỗi khi lấy lời mời kết bạn:", err);
        }
    };

    const sendFriendRequest = async (friendId) => {
        try {
            await axios.post(
                `${API_URL}/api/friends/add`,
                { user_id: userId, friend_id: friendId },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            alert("Đã gửi lời mời kết bạn.");
            toast.success("Đã gửi lời mời kết bạn.");
        } catch (error) {
            console.error("Lỗi gửi lời mời:", error);
            toast.error("Không thể gửi lời mời kết bạn.");
        }
    };

    const handleChatPress = async (otherUserId, otherUserDetail) => {
        try {
            const conversations = await axios.get(
                `${API_URL}/api/conversations/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const conversation = conversations.data.find(
                (conv) =>
                    Array.isArray(conv.participants) &&
                    conv.participants.includes(otherUserId)
            );

            if (conversation) {
                navigate(`/chat/${conversation.conversation_id}`, {
                    state: { otherUserDetail },
                });
            } else {
                alert("Chưa có cuộc trò chuyện với người này.");
            }
        } catch (error) {
            console.error("Lỗi lấy thông tin cuộc trò chuyện:", error);
            alert("Không thể lấy thông tin cuộc trò chuyện.");
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
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => sendFriendRequest(user.user_id)}
                            >
                                Gửi kết bạn
                            </button>
                        </li>
                    )
                ))}
            </ul>
        );
    };

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
                                <span>{request.userDetail?.fullname || 'Ẩn danh'}</span>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => acceptFriendRequest(request.user_id)}
                                    >
                                        Chấp nhận
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => cancelFriendRequest(request.user_id)}
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
                            <li key={`${userDetail?.user_id || index}-${userDetail?.fullname || index}`} className="list-group-item d-flex justify-content-between align-items-center">
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
                                    onClick={() => handleChatPress(userDetail?.user_id, userDetail)}
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
