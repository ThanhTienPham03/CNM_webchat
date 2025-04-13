import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const createUserDetail = async (userData, token) => {
    console.log('User data being sent:', userData);
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
    const payload = {
        user_id: userData.user_id,
        fullname: userData.fullname,
        age: userData.age,
        gender: userData.gender,
        avatar_url: userData.avatar,
    };
    const response = await axios.post(`${API_BASE_URL}/api/userDetails/add`, payload, config);
    return response.data;
};

export const updateUserDetail = async (userId, userData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.put(`${API_BASE_URL}/api/userDetails/update/${userId}`, userData, config);
    return response.data;
};

export const getUserDetailById = async (userId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.get(`${API_BASE_URL}/api/userDetails/${userId}`, config);
    return response.data;
};