import axios from "axios";

const MESSAGES_API = "http://localhost:3000/api/messages"; // Replace with your actual API endpoint
const API_URL = "http://localhost:3000/api"; // Thay thế URL API cố định

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
      const respone = await axios.post(`${MESSAGES_API}/add`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return respone.data;
    } catch (err) {
      throw err;
    }
  },
  async updateMessage(message_id, data, accessToken) {
    if (!message_id || !data || !accessToken) {
      throw new Error("Invalid message_id, data or accessToken");
    }
    try {
      const res = await axios.put(
        `${MESSAGES_API}/${message_id}/update`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (res) {
        const data = res.data;
        console.log("update message: ", data);
        return data;
      }
    } catch (err) {
      throw err;
    }
  },
  async revokeMessage(message_id, data, accessToken) {
    if (!message_id || !data || !accessToken) {
      throw new Error("Invalid message_id, data or accessToken");
    }
    try {
      const res = await axios.put(
        `${MESSAGES_API}/${message_id}/revoke`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (res) {
        const revokedMessage = res.data;
        console.log("revoke message: ", revokedMessage);
        return revokedMessage;
      }
    } catch (err) {
      throw err;
    }
  },
  async deleteMessage(message_id, data, accessToken) {
    if (!message_id || !data || !accessToken) {
      throw new Error("Invalid message_id, data or accessToken");
    }
    try {
      const res = await axios.delete(`${MESSAGES_API}/${message_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: data,
      });
      if (res) {
        const result = res.data;
        console.log("Delete message: ", result);
        return result;
      }
    } catch (err) {
      throw err;
    }
  },
  async sendImageAndText(formData, accessToken) {
    if (!formData || !accessToken) {
      throw new Error("Invalid formData or accessToken");
    }
    try {
      const respone = await axios.post(`${MESSAGES_API}/sendImage`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (respone) {
        console.log("upload image and text: ", respone.data);
        return respone.data;
      }
    } catch (err) {
      throw err;
    }
  },
  async sendFileOrImage(formData, token) {
    try {
      const response = await axios.post(
        `${API_URL}/messages/sendImage`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Response data from backend:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error sending file or image:", error);
      throw error;
    }
  },
};

export default MessageAPI;