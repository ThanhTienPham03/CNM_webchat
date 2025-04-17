import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAccessToken } from '../redux/slices/authSlice';
import LoginForm from '../components/Login/LoginForm';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLoginSuccess = (token) => {
        dispatch(setAccessToken(token));
        navigate('/home'); 
    };

    return (
        <div
            className="register-page d-flex align-items-center justify-content-center min-vh-100"
            style={{
                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                color: '#fff',
                padding: '20px',
            }}
        >
            <div className="card shadow-lg p-4"
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
                    borderRadius: '20px', 
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)', 
                    color: '#333',
                    padding: '30px', 
                    transition: 'transform 0.3s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                
                <LoginForm onLoginSuccess={handleLoginSuccess} />
                <p
                    className="text-center mt-4"
                    style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '14px',
                        color: '#666',
                    }}
                >
                    
                    chưa có tài khoản?{' '}
                    <a
                        href="/register"
                        className="text-primary"
                        style={{
                            color: '#2575fc',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseOver={(e) => {
                            e.target.style.color = '#6a11cb';
                            e.target.style.textDecoration = 'underline';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.color = '#2575fc';
                            e.target.style.textDecoration = 'none';
                        }}
                    >
                        Đăng ký
                    </a>
                </p>
                <p
                    className="text-center mt-2"
                    style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '14px',
                        color: '#666',
                    }}
                >
                    <a
                        href=""
                        className="text-primary"
                        style={{
                            color: '#2575fc',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseOver={(e) => {
                            e.target.style.color = '#6a11cb';
                            e.target.style.textDecoration = 'underline';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.color = '#2575fc';
                            e.target.style.textDecoration = 'none';
                        }}
                    >
                        Quên mật khẩu?
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;
