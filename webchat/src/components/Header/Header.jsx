import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import avatar from '../../assets/react.svg'; // Import hình ảnh avatar

const Header = ({ userName }) => {
  return (
    <div
      className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
      style={{ backgroundColor: '#6517ce' }} // Đặt màu nền tùy chỉnh
    >
      <div className="d-flex align-items-center">
        <img
          src={avatar} // Sử dụng hình ảnh từ import
          alt="User Avatar"
          className="rounded-circle me-3"
          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
        />
        <h5 className="mb-0">{userName}</h5>
      </div>
      <button className="btn btn-outline-light btn-sm">Logout</button>
    </div>
  );
};

export default Header;