import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const initialState = {
  user: null,
  token: Cookies.get('token') || null, // Retrieve token from cookies
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      Cookies.set('token', action.payload); // Save token to cookies
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      Cookies.remove('token'); // Remove token from cookies
    },
  },
});

export const { setUser, setToken, logout } = authSlice.actions;
export default authSlice.reducer;