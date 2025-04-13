import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const UserProfile = () => {
    const user = useSelector((state) => state.auth.user);
    const [isProfileVisible, setIsProfileVisible] = useState(false);

    const handleAvatarClick = () => {
        setIsProfileVisible(true);
    };

    return (
        <div className="user-profile-container">
            <div className="user-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                <img src={user?.avatar || 'default-avatar.png'} alt="User Avatar" />
            </div>
            {isProfileVisible && (
                <div className="user-profile">
                    <h2>Thông tin tài khoản</h2>
                    <h3>{user?.fullname || 'Username'}</h3>
                    <form>
                        <label>Họ và tên</label>
                        <input type="text" value={user?.fullname || ''} readOnly />

                        <label>Giới tính</label>
                        <input type="text" value={user?.gender || ''} readOnly />

                        <label>Tuổi</label>
                        <input type="text" value={user?.age || ''} readOnly />

                        <label>Điện thoại</label>
                        <input type="text" value={user?.phone || ''} readOnly />
                    </form>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
