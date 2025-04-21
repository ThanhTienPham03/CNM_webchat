import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Notification = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/notifications/${user.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setNotifications(res.data); // [{ message, type, status }]
        } catch (err) {
            console.error("Lỗi khi lấy thông báo:", err);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/notifications/unread-count/${user.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setUnreadCount(res.data.count);
        } catch (err) {
            console.error("Lỗi khi lấy thông báo:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${API_URL}/api/notifications/mark-read/${user.id}`, {}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setUnreadCount(0);
            fetchNotifications(); // Refresh notifications
        } catch (err) {
            console.error("Lỗi khi đánh dấu đã đọc:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, []);

    return (
        <div className="notification-container">
            <div className="notification-header">
                <h2>Thông báo</h2>
                <button onClick={markAllAsRead} className="mark-read-btn">
                    Đánh dấu tất cả là đã đọc
                </button>
            </div>
            <div className="notification-unread">
                <p>Bạn có {unreadCount} thông báo chưa đọc</p>
            </div>
            <ul className="notification-list">
                {notifications.map((noti, index) => (
                    <li key={index} className={`notification-item ${noti.status === 'unread' ? 'unread' : ''}`}>
                        <p>{noti.message}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notification;
