import React, { useEffect, useState } from 'react';
import { fetchNotifications } from '../api/notificationAPI';
import 'bootstrap/dist/css/bootstrap.min.css';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('user_id'); 
        const accessToken = localStorage.getItem('access_token'); 
        if (!userId || !accessToken) {
          console.error('Missing userId or accessToken');
          return;
        }
        const data = await fetchNotifications(userId, accessToken);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchData();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return 'Unknown time';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="container mt-4">
      {/* <h1 className="text-center mb-4 text-primary ">Notifications</h1> */}
      <ul className="list-group y-scroll">
        {notifications.map((notification, index) => (
          <li key={index} className="list-group-item">
            <div>{notification.message}</div>
            <small className="text-muted">{formatTime(notification.created_at)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationPage;