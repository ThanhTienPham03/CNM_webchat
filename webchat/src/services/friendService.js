import axios from 'axios';

const API_BASE_URL = '/api/friends';

const friendService = {
  async getAllFriends(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  },

  async addFriend(userId, friendId) {
    try {
      const response = await axios.post(API_BASE_URL, { userId, friendId });
      return response.data;
    } catch (error) {
      console.error('Error adding friend:', error);
      return null;
    }
  },
};

export default friendService;

const API_BASE_URL_CONVERSATIONS = 'http://localhost:3000/api';

export const addConversation = async (type, participants) => {
  try {
    const response = await axios.post(`${API_BASE_URL_CONVERSATIONS}/conversations/add`, {
      type,
      participants,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding conversation:', error);
    throw error;
  }
};