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

// console.log("API response:", response.data); 
export default ConversationApi;