import axios from "axios";
import {API_URL} from "./apiConfig";

const API_BASE_URL = `${API_URL}/api/conversations`;

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

      console.log("API response:", response.data); // Log chi tiết dữ liệu trả về từ API

      const conversations = response.data.map((item) => {
        console.log('Processing conversation:', item); // Log chi tiết từng conversation
        let lastMessageObj = {};
        if (typeof item.lastMessage === 'object' && item.lastMessage !== null) {
          lastMessageObj = item.lastMessage;
        } else if (typeof item.lastMessage === 'string') {
          lastMessageObj = { content: item.lastMessage };
        } else {
          lastMessageObj = { content: "No message" };
        }
        return {
          id: item.conversation_id,
          name: item.group_name || "",
          isGroup: item.type === "GROUP",
          participants: item.participants || [],
          participantDetails: item.participant_details || [],
          lastMessage: lastMessageObj,
          avatar: item.type === "GROUP" ? item.group_avatar : item.avatar,
          defaultAvatar: item.type === "GROUP" ? '/group-avatar.png' : '/OIP.png',
          time: item.created_at,
          type: item.type
        };
      });
      
      console.log("Mapped conversations:", conversations); // Log để debug
      return conversations;
    } catch (err) {
      console.error("Lỗi khi fetch conversations:", err.message || err);
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
      const response = await axios.get('http://18.141.182.181:3000/api/conversations', {
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