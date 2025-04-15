import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/friends'; 

export const getFriends = async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/${userId}`);
    return response.data;
};

export const sendFriendRequest = async (userId, friendId) => {
    const response = await axios.post(`${API_BASE_URL}/add`, { user_id: userId, friend_id: friendId });
    return response.data;
};

export const acceptFriendRequest = async (userId, friendId) => {
    const response = await axios.post(`${API_BASE_URL}/accept`, { user_id: userId, friend_id: friendId });
    return response.data;
};

export const getFriendRequests = async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/${userId}/requests`);
    return response.data;
};

export const blockUser = async (userId, friendId) => {
    const response = await axios.post(`${API_BASE_URL}/block`, { user_id: userId, friend_id: friendId });
    return response.data;
};

export const unblockUser = async (userId, friendId) => {
    const response = await axios.post(`${API_BASE_URL}/unblock`, { user_id: userId, friend_id: friendId });
    return response.data;
};