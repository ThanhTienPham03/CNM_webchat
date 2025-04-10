import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        passwordConfirm: '',
        otp: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const handleChange = ({ target: { id, value } }) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const validateForm = () => {
        const { username, email, phone, password, passwordConfirm } = formData;
        if (!username || !email || !phone || !password || !passwordConfirm) {
            return 'Vui lòng điền đầy đủ thông tin.';
        }
        if (password !== passwordConfirm) {
            return 'Mật khẩu và xác nhận mật khẩu không khớp.';
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok) {
                setOtpSent(true);
                setError('');
                console.log('OTP sent:', data.otp); // For testing purposes
            } else {
                setError(data.message || 'Đăng ký thất bại.');
            }
        } catch {
            setError('Lỗi kết nối đến máy chủ.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!formData.otp) {
            setError('Vui lòng nhập mã OTP.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/auth/verifyOtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(true);
                setError('');
            } else {
                setError(data.message || 'Xác thực OTP thất bại.');
            }
        } catch {
            setError('Lỗi kết nối đến máy chủ.');
        }
    };

    const renderInput = (id, label, type = 'text', placeholder) => (
        <Form.Group controlId={id} className="mb-3">
            <Form.Label style={{ fontWeight: 'bold' }}>{label}</Form.Label>
            <Form.Control
                type={type}
                placeholder={placeholder}
                required
                style={{
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    padding: '12px',
                }}
                value={formData[id]}
                onChange={handleChange}
            />
        </Form.Group>
    );

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={10} lg={10}>
                    <h1
                        className="text-center mb-4"
                        style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 'bold',
                            color: '#6a11cb',
                            fontSize: '26px',
                        }}
                    >
                        Đăng ký tài khoản
                    </h1>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">Đăng ký thành công!</Alert>}
                    <Form
                        style={{
                            backgroundColor: '#f9f9f9',
                            padding: '30px',
                            borderRadius: '12px',
                            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                        }}
                        onSubmit={otpSent ? handleVerifyOtp : handleSubmit}
                    >
                        {renderInput('username', 'Tên đăng nhập', 'text', 'Nhập tên đăng nhập')}
                        {renderInput('email', 'Email', 'email', 'Nhập email của bạn')}
                        {renderInput('phone', 'Số điện thoại', 'text', 'Nhập số điện thoại')}
                        {renderInput('password', 'Mật khẩu', 'password', 'Nhập mật khẩu')}
                        {renderInput('passwordConfirm', 'Xác nhận mật khẩu', 'password', 'Xác nhận mật khẩu')}
                        {otpSent && renderInput('otp', 'Mã OTP', 'text', 'Nhập mã OTP')}

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
                            onMouseOver={(e) =>
                                (e.target.style.background = 'linear-gradient(135deg, #2575fc 0%, #6a11cb 100%)')
                            }
                            onMouseOut={(e) =>
                                (e.target.style.background = 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)')
                            }
                        >
                            {otpSent ? 'Xác thực OTP' : 'Đăng ký'}
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default RegisterForm;
