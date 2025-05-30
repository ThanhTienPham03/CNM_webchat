import axios from "axios";
import { API_URL } from "./apiConfig";


export const fetchNotifications = async (userId, accessToken) => {
  try {
    const res = await axios.get(`${API_URL}/api/notifications/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    console.error("Lỗi khi lấy thông báo:", err);
    throw err;
  }
};

export const fetchUnreadCount = async (userId, accessToken) => {
  try {
    const res = await axios.get(
      `${API_URL}/api/notifications/unread-count/${userId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return res.data.count;
  } catch (err) {
    console.error("Lỗi khi lấy số thông báo chưa đọc:", err);
    throw err;
  }
};

export const markAllAsRead = async (userId, accessToken) => {
  try {
    await axios.put(
      `${API_URL}/api/notifications/mark-read/${userId}`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  } catch (err) {
    console.error("Lỗi khi đánh dấu đã đọc:", err);
    throw err;
  }
};