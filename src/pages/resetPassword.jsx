import React from 'react';
import ChangePasswordForm from '../components/ResetPassword/ChangePasswordForm';
import { Container, Row, Col } from 'react-bootstrap';

const ResetPassword = () => {
    return (
        <Container
            fluid
            className="register-page d-flex align-items-center justify-content-center min-vh-100"
            style={{
                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                color: '#fff',
                padding: '20px',
                fontFamily: "'Poppins', sans-serif",
            }}
        >
            <Row className="justify-content-center">
                <Col lg={100} md={100} >
                    <div
                        className="card shadow-lg p-4"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                            color: '#333',
                            padding: '20px',
                            transition: 'transform 0.3s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <h2
                            className="text-center mb-4"
                            style={{ color: '#2575fc', fontWeight: '600' }}
                        >
                            Đặt lại mật khẩu
                        </h2>
                        <ChangePasswordForm />
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default ResetPassword;
