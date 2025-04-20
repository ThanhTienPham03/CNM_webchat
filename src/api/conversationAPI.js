import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api/conversations";

const ConversationApi = {
  async fetchConversationsByUserId(userId, accessToken) {
    if (!userId || !accessToken) {
      throw new Error("Invalid user_id or accessToken");
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const conversations = response.data.map((item) => ({
        id: item.conversation_id, 
        name: item.participants.join(", ") || "Unknown User", 
        lastMessage: item.lastMessage?.content || item.lastMessage || "No message", 
        avatar: item.avatar || null, 
        time: item.created_at, 
      }));
      return conversations;
    } catch (err) {
      throw new Error(err.message || "Failed to fetch conversations");
    }
  },
  async fetchConversationsByConverId(conversation_id, accessToken) {
    if (!conversation_id || !accessToken) {
      throw new Error("Invalid user_id or accessToken");
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/${conversation_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response) {
        const conversation = response.data;
        return conversation;
      }
    } catch (err) {
      throw new Error(err);
    }
  },
  async fetchAllConversations(accessToken) {
    try {
      const response = await axios.get('http://localhost:3000/api/conversations', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data || error.message);
    }
  }
};

export const createConversation = async (userId, otherUserId, accessToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ participants: [userId, otherUserId] }),
    });

    if (!response.ok) {
      throw new Error('Không thể tạo cuộc trò chuyện');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi tạo cuộc trò chuyện:', error);
    throw error;
  }
};

// console.log("API response:", response.data); 
export default ConversationApi;