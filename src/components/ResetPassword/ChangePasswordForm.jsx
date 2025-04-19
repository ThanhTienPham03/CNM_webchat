import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const validateToken = async (token) => {
    try {
        const decoded = jwtDecode(token);
        const now = Math.floor(Date.now() / 1000);

        if (decoded.exp < now) {
            const res = await axios.post('http://localhost:3000/auth/refreshToken', { token });
            return res.data.newToken;
        }

        return token;
    } catch (err) {
        throw new Error('Invalid token');
    }
};

const ChangePasswordForm = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setMessage('Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('New passwords do not match!');
            return;
        }

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            setMessage('Session expired. Please log in again.');
            window.location.href = '/';
            return;
        }

        setLoading(true);

        try {
            const validToken = await validateToken(accessToken);

            // Step 1: Check old password
            const verifyRes = await axios.post('http://localhost:3000/api/users/checkMatchPassword',
                { oldPassword },
                { headers: { Authorization: `Bearer ${validToken}` } }
            );

            if (!verifyRes.data.match) {
                setMessage('Old password is incorrect!');
                setLoading(false);
                return;
            }

            // Step 2: Update new password
            const updateRes = await axios.post('http://localhost:3000/api/users/updatePassword',
                { newPassword },
                { headers: { Authorization: `Bearer ${validToken}` } }
            );

            if (updateRes.status === 200) {
                setMessage('Password updated successfully!');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage('Failed to update password.');
            }
        } catch (err) {
            console.error('Change password error:', err);
            const errMsg = err.response?.data?.message || err.message || 'Error occurred';
            setMessage(errMsg);
        } finally {
            setLoading(false);
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
            <h2 style={{ textAlign: 'center' }}>Change Password</h2>

            <div style={{ marginBottom: '15px' }}>
                <label>Old Password:</label>
                <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>New Password:</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>Confirm New Password:</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
            </div>

            <button type="submit" style={buttonStyle} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
            </button>

            {message && (
                <p style={{
                    marginTop: '15px',
                    color: message.toLowerCase().includes('success') ? 'green' : 'red',
                    textAlign: 'center'
                }}>
                    {message}
                </p>
            )}
        </form>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px'
};

const buttonStyle = {
    width: '100%',
    padding: '10px',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
};

export default ChangePasswordForm;
