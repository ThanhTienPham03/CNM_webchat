import React from 'react';
import { useSelector } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';

const UserInfo = () => {
    const user = useSelector((state) => state.auth.user);

    return (
        <div className="d-flex align-items-center">
            <img
                src={user?.avatar || 'default-avatar.png'}
                alt="User Avatar"
                className="rounded-circle me-3"
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <h5 className="mb-0">{user?.fullname || 'Tên người dùng'}</h5>
        </div>
    );
};

export default UserInfo;