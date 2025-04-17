import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const initialState = {
  user: null,
  accessToken: Cookies.get('accessToken') || null, 
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      console.log('User:', state.user);
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      Cookies.set('accessToken', action.payload); 
      console.log('AccessToken:', state.accessToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      Cookies.remove('accessToken'); 
    },
  },
});

export const { setUser, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;