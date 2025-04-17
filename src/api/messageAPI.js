import axios from "axios";

const MESSAGES_API = "http://localhost:3000/api/messages"; // Replace with your actual API endpoint

const MessageAPI = {
  async fetchMessages(conversation_id, accessToken) {
    if (!conversation_id || !accessToken) {
      throw new Error("Invalid conversation_id or token");
    }
    try {
      const response = await axios.get(`${MESSAGES_API}/${conversation_id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response) {
        const messages = response.data;
        return messages;
      }
    } catch (err) {
      throw err;
    }
  },
  async sendMessage(data, accessToken) {
    if (!data || !accessToken) {
      throw new Error("Invalid data and accessToken");
    }
    try {
      const response = await axios.post(`${MESSAGES_API}/add`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  },
  async updateMessage(message_id, data, accessToken) {
    if (!message_id || !data || !accessToken) {
      throw new Error("Invalid message_id, data or accessToken");
    }
    try {
      const response = await axios.put(
        `${MESSAGES_API}/${message_id}/update`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  },
  async revokeMessage(message_id, data, accessToken) {
    if (!message_id || !data || !accessToken) {
      throw new Error("Invalid message_id, data or accessToken");
    }
    try {
      const response = await axios.put(
        `${MESSAGES_API}/${message_id}/revoke`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  },
  async deleteMessage(message_id, data, accessToken) {
    if (!message_id || !data || !accessToken) {
      throw new Error("Invalid message_id, data or accessToken");
    }
    try {
      const response = await axios.delete(`${MESSAGES_API}/${message_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: data,
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  },
  async sendImageMessage(formData, accessToken) {
    if (!formData || !accessToken) {
      throw new Error("Invalid formData or accessToken");
    }
    try {
      const response = await axios.post(`${MESSAGES_API}/sendImage`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  },
};

export default MessageAPI;