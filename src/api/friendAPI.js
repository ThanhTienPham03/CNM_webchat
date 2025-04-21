import axios from 'axios';

// Hàm lấy user_id từ localStorage
const getUserId = () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        throw new Error('Không tìm thấy user_id. Vui lòng đăng nhập.');
    }
    return userId;
};

// Hàm lấy auth_token từ localStorage
const getAuthToken = () => {
    const token = localStorage.getItem('access_token');
    console.log('Lấy token từ localStorage:', token);
    if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập.');
    }
    return token;
};

// Tạo instance Axios
const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api',
});

// Interceptor để thêm header Authorization động
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor để xử lý lỗi 401 (Unauthorized)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            window.location.href = '/';
            throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        }
        return Promise.reject(error);
    }
);

// Lấy danh sách bạn bè
export const getFriends = async (userId = getUserId()) => {
    try {
        const response = await axiosInstance.get(`/friends/${userId}`);
        console.log('Dữ liệu trả về từ API getFriends:', response.data); // Log dữ liệu trả về
        return response.data;
    } catch (error) {
        console.error('Lỗi khi tải danh sách bạn bè:', error);
        throw new Error(error.response?.data?.message || 'Không thể tải danh sách bạn bè');
    }
};

// Gửi yêu cầu kết bạn
export const sendFriendRequestWithAxios = async (friendId) => {
    try {
        if (!friendId) {
            throw new Error("friendId không được để trống.");
        }

        const response = await axiosInstance.post(`/friends/request`, {
            friend_id: friendId,
        });

        console.log("Yêu cầu kết bạn thành công:", response.data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.error("Lỗi từ server:", error.response.data);
        } else {
            console.error("Lỗi khi gửi yêu cầu kết bạn:", error.message);
        }
        throw error;
    }
};

// Chấp nhận yêu cầu kết bạn
export const acceptFriendRequest = async (friendId) => {
    const userId = getUserId();
    if (!userId || isNaN(userId)) {
        throw new Error("userId không hợp lệ. Vui lòng kiểm tra lại.");
    }
    if (!friendId || isNaN(friendId)) {
        throw new Error("friendId không hợp lệ. Vui lòng kiểm tra lại.");
    }
    try {
        const response = await axiosInstance.post(`/friends/accept`, {
            user_id: userId,
            friend_id: friendId,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể chấp nhận yêu cầu kết bạn');
    }
};

// Lấy danh sách yêu cầu kết bạn
export const getFriendRequests = async () => {
    try {
        // Sử dụng endpoint đúng là /friends/requests/:userId
        const response = await axiosInstance.get(`/friends/requests/${getUserId()}`);
        return response.data || [];
    } catch (error) {
        if (error.response?.status === 404) {
            // Trả về mảng rỗng nếu endpoint không tồn tại
            return [];
        }
        throw new Error(error.response?.data?.message || 'Không thể tải yêu cầu kết bạn');
    }
};

// Chặn người dùng
export const blockUser = async (friendId) => {
    try {
        const response = await axiosInstance.post(`/friends/block`, {
            user_id: getUserId(),
            friend_id: friendId,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể chặn người dùng');
    }
};

// Bỏ chặn người dùng
export const unblockUser = async (friendId) => {
    try {
        const response = await axiosInstance.post(`/friends/unblock`, {
            user_id: getUserId(),
            friend_id: friendId,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể bỏ chặn người dùng');
    }
};

// Removed setLoading from the API layer as it is a UI-related function
export const searchUser = async (keyword) => {
    if (!keyword.trim()) {
        throw new Error("Vui lòng nhập email hoặc số điện thoại.");
    }

    try {
        const response = await axiosInstance.post(
            `/users/search`,
            {
                keyword: keyword,
                id: Number(getUserId()),
            },
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const { users, userDetails } = response.data;

        return users.map((u) => {
            const detail = userDetails.find((d) => d.user_id === u.id) || {};
            return { ...u, ...detail };
        });
    } catch (error) {
        console.error("Lỗi tìm người dùng:", error);
        throw new Error("Không thể tìm kiếm người dùng.");
    }
};

export const sendFriendRequest = async (friendId) => {
    const userId = getUserId();
    if (!userId || isNaN(userId)) {
        throw new Error("userId không hợp lệ. Vui lòng kiểm tra lại.");
    }
    if (!friendId || isNaN(friendId)) {
        throw new Error("friendId không hợp lệ. Vui lòng kiểm tra lại.");
    }
    try {
        console.log("Gửi lời mời kết bạn cho ID:", friendId);
        const response = await axiosInstance.post(`/friends/add`, {
            user_id: userId,
            friend_id: friendId,
        });
        console.log("Kết quả API:", response.data);
        Alert.alert("Thành công", "Đã gửi lời mời kết bạn.");
        return response.data;
    } catch (error) {
        console.error("Lỗi gửi lời mời:", error);
        Alert.alert("Lỗi", error.response?.data?.message || "Không thể gửi lời mời kết bạn.");
        throw error;
    }
};