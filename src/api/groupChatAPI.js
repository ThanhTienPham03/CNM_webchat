import axios from "axios";
import { API_URL } from "./apiConfig";

const API_BASE_URL = `${API_URL}/api/conversations`;

const GroupChatAPI = {
  // Tạo nhóm chat mới
  async createGroup(groupData, formData, accessToken) {
    console.log('Creating group with data:', groupData);
    console.log('Has avatar:', formData.has('group_avatar'));

    try {
      // Gửi request tạo nhóm với dữ liệu JSON
      const response = await axios.post(
        `${API_BASE_URL}/add_group`,
        groupData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Group creation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: groupData
      });
      throw new Error(error.response?.data?.message || error.message || 'Error creating group');
    }
  },

  

  // Thêm thành viên vào nhóm
  async addMember(conversationId, userId, accessToken) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/conversations/addParticipant/${conversationId}`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to add member");
    }
  },

  // Xóa thành viên khỏi nhóm
  async removeMember(conversationId, userId, accessToken) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/conversations/removeParticipant/${conversationId}`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to remove member");
    }
  },

  // Gửi tin nhắn
  async sendMessage(messageData, accessToken) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/messages/add`,
        messageData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Lấy tin nhắn trong nhóm
  async getMessages(conversationId, accessToken) {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch messages");
    }
  },

  // Cập nhật tin nhắn
  async updateMessage(messageId, content, accessToken) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/messages/${messageId}/update`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update message");
    }
  },

  // Xóa tin nhắn
  async deleteMessage(messageId, accessToken) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete message");
    }
  },

  // Thu hồi tin nhắn
  async revokeMessage(messageId, accessToken) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/messages/${messageId}/revoke`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to revoke message");
    }
  },
};

export default GroupChatAPI;