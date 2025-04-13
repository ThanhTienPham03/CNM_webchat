import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import avatar from '../../assets/react.svg'; // Import hình ảnh avatar
import { useNavigate } from 'react-router-dom';
import UserProfile from '../UserProfile/UserProfile';
import UserInfo from '../UserProfile/UserInfo';
import { getUserDetailById } from '../../services/userService';
import Cookies from 'js-cookie';

const Header = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    const fetchUserDetail = async () => {
      const accessToken = Cookies.get('accessToken');
      const userCookie = Cookies.get('user');
      if (accessToken && userCookie) {
        const user = JSON.parse(userCookie);
        try {
          const detail = await getUserDetailById(user.id, accessToken);
          setUserDetail(detail);
        } catch (error) {
          console.error('Error fetching user detail:', error);
        }
      }
    };

    fetchUserDetail();
  }, []);

  const handleAvatarClick = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
      style={{ backgroundColor: '#6517ce' }} // Đặt màu nền tùy chỉnh
    >
      {userDetail && (
        <div className="d-flex align-items-center">
          <img
            src={userDetail.avatar_url || 'default-avatar.png'}
            alt="User Avatar"
            className="rounded-circle me-3"
            style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
          />
          <h5 className="mb-0">{userDetail.fullname || 'Tên người dùng'}</h5>
        </div>
      )}
      <button className="btn btn-outline-light btn-sm">Logout</button>
    </div>
  );
};

export default Header;