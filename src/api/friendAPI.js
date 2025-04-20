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
        const response = await axiosInstance.post(`/friends/request`, {
            user_id: getUserId(),
            friend_id: friendId,
        });
        Alert.alert("Thành công", "Đã gửi yêu cầu kết bạn.");
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể gửi yêu cầu kết bạn');
    }
};

// Chấp nhận yêu cầu kết bạn
export const acceptFriendRequest = async (friendId) => {
    try {
        const response = await axiosInstance.post(`/friends/accept`, {
            user_id: getUserId(),
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

export const searchUser = async () => {
    if (!keyword.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập email hoặc số điện thoại.");
        return;
    }

    try {
        setLoading(true);
        const response = await axios.post(`${API_URL}/api/users/search`,
            {
                keyword: keyword,
                id: Number(user.id),
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const { users, userDetails } = response.data;

        const combinedResults = users.map((u) => {
            const detail = userDetails.find((d) => d.user_id === u.id) || {};
            return { ...u, ...detail };
        });

        setResults(combinedResults);
    } catch (error) {
        console.error("Lỗi tìm người dùng:", error);
        Alert.alert("Lỗi", "Không thể tìm kiếm người dùng.");
    } finally {
        setLoading(false);
    }
};

export const sendFriendRequest = async (friendId) => {
    try {
      await axios.post(`http://localhost:3000/api/friends/add`, {
        user_id: user.id,
        friend_id: friendId,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      });
      Alert.alert("Thành công", "Đã gửi lời mời kết bạn.");
    } catch (error) {
      console.error("Lỗi gửi lời mời:", error);
      Alert.alert("Lỗi", "Không thể gửi lời mời kết bạn.");
    }
  };