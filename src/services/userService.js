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
    console.log('Fetching user detail for userId:', userId);
    console.log('Using token:', token);
    console.log('API URL:', `${API_BASE_URL}/api/userDetails/${userId}`);
    const response = await axios.get(`${API_BASE_URL}/api/userDetails/${userId}`, config);
    const userDetails = response.data;

    // Validate the response structure
    if (!userDetails) {
        console.warn('No user details received from API');
        return null; // Return null if no data is received
    }

    const { fullname, age, gender, avatar_url } = userDetails;

    if (
        !fullname ||
        !age ||
        typeof gender !== 'boolean' ||
        !avatar_url
    ) {
        console.warn('Incomplete user details received:', userDetails);
        return { fullname: fullname || '', age: age || 0, gender: typeof gender === 'boolean' ? gender : null, avatar_url: avatar_url || '' };
    }

    console.log('Validated user details:', userDetails);
    return userDetails;
};

export const sendOTP = async (email) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/sendOtp`, { email });
    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/verifyOtp`, { email, otp });
    return response.data.isValid;
};

export const updatePassword = async (email, newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/updatePassword`, { email, newPassword });
    return response.data;
};

