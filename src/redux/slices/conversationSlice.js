import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ConversationApi from "../../api/conversationAPI";

export const fetchAllConversations = createAsyncThunk(
  "conversations/fetchAll",
  async (token, { rejectWithValue }) => {
    try {
      const conversations = await ConversationApi.fetchAllConversations(token);
      return conversations;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const conversationSlice = createSlice({
  name: "conversations",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default conversationSlice.reducer;