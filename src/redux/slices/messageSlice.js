import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import messageAPI from "../../api/messageAPI";

const initialState = {
  messages: [],
  loading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ conversationId, token }, { rejectWithValue }) => {
    try {
      const messages = await messageAPI.fetchMessages(conversationId, token);
      return messages;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async ({ messageData, token }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.sendMessage(messageData, token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const newMessage = {
        ...action.payload,
        content: action.payload.content || "[No Content]",
      };
      state.messages.push(newMessage);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.map((message) => ({
          ...message,
          content: message.content || "[No Content]",
        }));
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (!action.payload || typeof action.payload !== 'object') {
          console.error("Invalid API response for sendMessage:", action.payload);
          return;
        }
        const newMessage = {
          ...action.payload,
          content: action.payload.content || "[No Content]",
        };
        console.log("API response for sendMessage:", action.payload);
        state.messages.push(newMessage);
      });
  },
});

export const { addMessage } = messageSlice.actions;

export default messageSlice.reducer;