import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import avatar from '../../assets/react.svg'; // Import hình ảnh avatar
import { useNavigate } from 'react-router-dom';
import UserProfile from '../UserProfile/UserProfile';
import UserInfo from '../UserProfile/UserInfo';
import { getUserDetailById } from '../../services/userService';
import Cookies from 'js-cookie';
import { FaSearch } from 'react-icons/fa'; // Import search icon
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import axios from 'axios';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showProfile, setShowProfile] = useState(false); // State để hiển thị form user profile
  const [userDetail, setUserDetail] = useState(null);

  const user = useSelector((state) => state.auth.user); // Get user from Redux store

  useEffect(() => {
    if (user) {
      setUserDetail(user); // Update userDetail when Redux user changes
    }
  }, [user]);

  useEffect(() => {
    const fetchUserDetail = async () => {
      const accessToken = Cookies.get('accessToken');
      const userCookie = Cookies.get('user');
      console.log('AccessToken:', accessToken);
      console.log('User Cookie:', userCookie);

      if (accessToken && userCookie) {
        const user = JSON.parse(userCookie);
        console.log('Parsed User:', user);

        try {
          const detail = await getUserDetailById(user.id, accessToken);
          console.log('Fetched User Detail:', detail);
          setUserDetail(detail);
        } catch (error) {
          console.error('Error fetching user detail:', error);
        }
      }
    };

    fetchUserDetail();
  }, []);

  const handleAvatarClick = () => {
    console.log('Avatar clicked. Current userDetail:', userDetail);
    console.log('Current showProfile state:', showProfile);
    if (!userDetail) {
      console.warn('userDetail is null or undefined. Cannot show profile.');
    } else if (!userDetail.id) {
      console.warn('userDetail.id is missing. Cannot show profile.');
    }
    setShowProfile(true); // Hiển thị form user profile
  };

  const handleCloseProfile = () => {
    setShowProfile(false); // Đóng form user profile
  };

  const handleLogout = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      if (accessToken) {
        const response = await axios.post('http://localhost:3000/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('Logout response:', response.data);
      }
      dispatch(logout());
      Cookies.remove('user');
      Cookies.remove('accessToken');
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUserDetail(updatedUser); // Update the userDetail state with the new data
    // Optionally, dispatch an action to update the Redux store
    dispatch({ type: 'auth/updateUser', payload: updatedUser });
  };

  return (
    <div
      className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
      style={{ backgroundColor: '#6a11cb', borderBottom: '2px solid #4a0e9e' }}
    >
      {userDetail && (
        <div className="d-flex align-items-center">
          <img
            src={userDetail.avatar_url || 'default-avatar.png'}
            alt="User Avatar"
            className="rounded-circle me-3"
            style={{
              width: '50px',
              height: '50px',
              objectFit: 'cover',
              cursor: 'pointer',
              border: '2px solid #fff',
            }}
            onClick={handleAvatarClick} // Thêm sự kiện onClick
          />
          <h5
            className="mb-0"
            style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff', marginRight: '15px' }}
          >
            {userDetail.fullname || 'Tên người dùng'}
          </h5>
        </div>
      )}
      <button
        className="btn btn-outline-light btn-sm"
        style={{
          borderRadius: '20px',
          padding: '5px 15px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s ease',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#4a0e9e')}
        onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
        onClick={handleLogout}
      >
        Logout
      </button>
      {showProfile && userDetail?.user_id && (
        <div
          style={{
            position: 'fixed', // Đặt form ở giữa màn hình
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <button
            className="btn btn-danger mt-3"
            onClick={handleCloseProfile}
            style={{ position: 'absolute', top: '5px', right: '10px', fontSize: '0.8rem', padding: '2px 6px' }}
          >
           <i class="bi bi-x-square-fill"></i>
          </button>
          <UserProfile userId={userDetail.user_id} onUserUpdate={handleUserUpdate} />
        </div>
      )}
    </div>
  );
};

export default Header;