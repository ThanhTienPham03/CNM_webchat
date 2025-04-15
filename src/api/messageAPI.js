import axios from "axios";
const MESSAGES_API = "http://localhost:3000/api/messages";

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
        // Normalize the `content` field to ensure it is always a string or a JSON string.
        const messages = response.data.map((message) => ({
          ...message,
          content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
        }));
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
      console.log("Sending message data:", data); // Log data being sent
      const response = await axios.post(`${MESSAGES_API}/add`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("API response:", response.data); // Log API response
      return response.data;
    } catch (err) {
      console.error("Error from API:", err.response?.data || err.message); // Log error details
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
};

export default MessageAPI;
