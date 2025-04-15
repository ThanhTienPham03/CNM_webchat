import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import friendReducer from './slices/friendSlice';
import messageReducer from './slices/messageSlice';

const store = configureStore({
  reducer: {
    messages: messageReducer, 
    auth: authReducer,
    friends: friendReducer,
  },
});

export default store;