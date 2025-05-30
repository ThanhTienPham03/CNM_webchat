import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../UserProfile/UserProfile';
import UserInfo from '../UserProfile/UserInfo';
import { getUserDetailById } from '../../services/userService';
import Cookies from 'js-cookie';
import { FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import axios from 'axios';
import { API_URL } from '../../api/apiConfig'; // Đường dẫn đến tệp apiConfig.js 

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showProfile, setShowProfile] = useState(false);
  const [userDetail, setUserDetail] = useState(null);

  const user = useSelector((state) => state.auth.user); 

  useEffect(() => {
    if (user) {
      console.log('User from Redux:', user);
      setUserDetail(user); 
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
    } else if (!userDetail.user_id) {
      console.warn('userDetail.user_id is missing. Cannot show profile.');
    }
    setShowProfile(true); 
  };

  const handleCloseProfile = () => {
    setShowProfile(false); 
  };

  const handleLogout = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      if (accessToken) {
        const response = await axios.post(`${API_URL}/auth/logout`, {}, {
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
    setUserDetail(updatedUser); 
    dispatch({ type: 'auth/updateUser', payload: updatedUser });
  };

  return (
    <div className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm" style={{ backgroundColor: '#6a11cb', borderBottom: '2px solid #4a0e9e' }} >
      {userDetail && (
        <div className="d-flex align-items-center">
          <img src={userDetail.avatar_url || './public/OIP.png'} alt="User Avatar" className="rounded-circle me-3" style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', border: '2px solid #fff' }} onClick={handleAvatarClick} />
          <h5 className="mb-0" style={{ fontWeight: 'bold', fontSize: '20px', color: '#fff', marginRight: '15px' }}>
            {userDetail.fullname || 'Tên người dùng'}
          </h5>
        </div>
      )}
      <div className="d-flex align-items-center">
        <button className="btn btn-outline-light btn-sm"  style={{ borderRadius: '20px', padding: '8px 20px', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.3s ease', }} onMouseOver={(e) => (e.target.style.backgroundColor = 'red')} onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')} onClick={handleLogout} >
        <i className ="bi bi-box-arrow-right"></i>
        </button>
      </div>
      {showProfile && userDetail?.user_id && (
        <div style={{ position: 'fixed',top: '50%',left: '50%',transform: 'translate(-50%, -50%)',background: 'white',border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', zIndex: 100, padding: '20px',}}>
          <button className="btn btn-danger mt-3" onClick={handleCloseProfile} style={{ position: 'absolute', top: '5px', right: '10px', fontSize: '0.8rem', padding: '2px 6px' }}>
           <i class="bi bi-x-square-fill"></i>
          </button>
          <UserProfile userId={userDetail.user_id} onUserUpdate={handleUserUpdate} />
        </div>
      )}
    </div>
  );
};

export default Header;