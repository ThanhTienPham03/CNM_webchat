import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sendFriendRequest } from '../../redux/slices/friendSlice';

const UserProfile = ({ userId, profileId }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const [isProfileVisible, setIsProfileVisible] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const handleAvatarClick = () => {
        setIsProfileVisible(true);
    };

    const handleSendRequest = () => {
        dispatch(sendFriendRequest({ userId, friendId: profileId }));
        setRequestSent(true);
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
                    {!requestSent ? (
                        <button onClick={handleSendRequest}>Send Friend Request</button>
                    ) : (
                        <p>Friend request sent!</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfile;
