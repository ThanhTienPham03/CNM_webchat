import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import avatar from '../../assets/react.svg'; // Import hình ảnh avatar
import { useNavigate } from 'react-router-dom';
import UserProfile from '../UserProfile/UserProfile';
import UserInfo from '../UserProfile/UserInfo';
import { getUserDetailById } from '../../services/userService';
import Cookies from 'js-cookie';
import { FaSearch } from 'react-icons/fa'; // Import search icon

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
          />
          <h5
            className="mb-0"
            style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff', marginRight: '15px' }}
          >
            {userDetail.fullname || 'Tên người dùng'}
          </h5>
          {/* <div className="d-flex align-items-center">
            <FaSearch
              style={{
                fontSize: '20px',
                marginRight: '10px',
                cursor: 'pointer',
                color: '#fff',
              }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              style={{
                padding: '5px 10px',
                borderRadius: '20px',
                border: '1px solid #ddd',
                outline: 'none',
                width: '200px',
                transition: 'width 0.3s ease',
              }}
              onFocus={(e) => (e.target.style.width = '300px')}
              onBlur={(e) => (e.target.style.width = '200px')}
            />
          </div> */}
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
      >
        Logout
      </button>
    </div>
  );
};

export default Header;