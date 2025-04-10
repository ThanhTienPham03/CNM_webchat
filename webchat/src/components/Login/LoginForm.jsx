import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            const response = await axios.post('http://localhost:3000/auth/login', { username, password });

            if (response.status === 200) {
                const { accessToken, user } = response.data;
                console.log('Login successful:', user);
                console.log('Access Token:', accessToken);
                localStorage.setItem('accessToken', accessToken);
                navigate('/home');
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Tài khoản hoặc mật khẩu không đúng');
            } else {
                setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
            }
            console.error(err);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={10} lg={10}>
                    <h1 className="text-center mb-4"
                        style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 'bold',
                            color: '#6a11cb',
                            fontSize: '26px',
                        }}>
                        Đăng nhập
                    </h1>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form
                        onSubmit={handleSubmit}
                        style={{
                            backgroundColor: '#f9f9f9',
                            padding: '30px',
                            borderRadius: '12px',
                            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                        }}
                    >
                        <Form.Group controlId="username" className="mb-3">
                            <Form.Label style={{ fontWeight: 'bold' }}>Tên đăng nhập</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    padding: '12px',
                                }}
                            />
                        </Form.Group>

                        <Form.Group controlId="password" className="mb-3">
                            <Form.Label style={{ fontWeight: 'bold' }}>Mật khẩu</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Nhập mật khẩu"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    padding: '12px',
                                }}
                            />
                        </Form.Group>

                        <Button
                            variant="primary"
                            type="submit"
                            className="w-100"
                            style={{
                                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                transition: 'background 0.3s ease',
                            }}
                            onMouseOver={(e) => (e.target.style.background = 'linear-gradient(135deg, #2575fc 0%, #6a11cb 100%)')}
                            onMouseOut={(e) => (e.target.style.background = 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)')}
                        >
                            Đăng nhập
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginForm;
