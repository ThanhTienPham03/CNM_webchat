import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


export const fetchFriends = createAsyncThunk('friends/fetch', async () => {
  const res = await axios.get('/api/friends');
  return res.data;
});


export const sendFriendRequest = createAsyncThunk(
  'friends/sendRequest',
  async (friend_id) => {
    const res = await axios.post('/api/friend-request', { friend_id });
    return res.data;
  }
);


export const fetchPendingRequests = createAsyncThunk('friends/pending', async () => {
  const res = await axios.get('/api/friend-request');
  return res.data;
});


export const acceptFriendRequest = createAsyncThunk(
  'friends/accept',
  async (request_id) => {
    const res = await axios.post('/api/friend-request/accept', { request_id });
    return res.data;
  }
);

const friendSlice = createSlice({
  name: 'friends',
  initialState: {
    list: [],
    pendingRequests: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.list = action.payload;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.pendingRequests = action.payload;
      });
  },
});

export default friendSlice.reducer;
