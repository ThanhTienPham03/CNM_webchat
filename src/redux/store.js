import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import friendReducer from './slices/friendSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    friends: friendReducer,
  },
});

export default store;