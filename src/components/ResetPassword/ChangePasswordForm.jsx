import React, { useState } from 'react';
import axios from 'axios';

const ChangePasswordForm = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage('New passwords do not match!');
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/api/user/updatePassword', {
                oldPassword,
                newPassword
            });
            setMessage(response.data.message || 'Password updated successfully!');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error updating password');
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            style={{
                maxWidth: '400px',
                margin: '0 auto',
                padding: '20px',
                background: '#f0f2f5',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                fontFamily: "'Roboto', sans-serif",
                color: '#333'
            }}
        >
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="oldPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Old Password:</label>
                <input
                    type="password"
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d9d9d9',
                        fontSize: '14px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>New Password:</label>
                <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d9d9d9',
                        fontSize: '14px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Confirm New Password:</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d9d9d9',
                        fontSize: '14px'
                    }}
                />
            </div>
            <button 
                type="submit" 
                style={{
                    width: '100%',
                    padding: '10px',
                    background: '#4a90e2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#357abd'}
                onMouseOut={(e) => e.target.style.background = '#4a90e2'}
            >
                Change Password
            </button>
            {message && <p style={{ textAlign: 'center', marginTop: '15px', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
        </form>
    );
};

export default ChangePasswordForm;