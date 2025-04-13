import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { setUser, setAccessToken } from '../../redux/slices/authSlice';
import { createUserDetail, getUserDetailById } from '../../services/userService';

const LoginForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUserInfoFormVisible, setIsUserInfoFormVisible] = useState(false);
    const [userInfo, setUserInfo] = useState({ fullname: '', age: '', gender: '', avatar_url: '', user_id: '' });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        const checkUserInfo = async () => {
            const accessToken = Cookies.get('accessToken');
            if (accessToken) {
                try {
                    const userId = 'userId'; 
                    const response = await getUserDetailById(userId, accessToken);
                    if (response) {
                        navigate('/home');
                    }
                } catch (err) {
                    console.error('Error fetching user info:', err);
                }
            }
        };
        checkUserInfo();
    }, [navigate]);

    const validateUserInfo = () => {
        const errors = {};
        if (!userInfo.fullname.trim()) errors.fullname = 'Họ và tên không được để trống';
        if (!userInfo.age || userInfo.age <= 0) errors.age = 'Tuổi phải là số dương';
        if (!userInfo.gender) errors.gender = 'Vui lòng chọn giới tính';
        return errors;
    };

    // Ensure user information is checked correctly after login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 

        try {
            const response = await axios.post('http://localhost:3000/auth/login', { username, password });
            if (response.status === 200) {
                const { accessToken, user } = response.data;
                console.log('Login successful:', user);
                console.log('Access Token:', accessToken);
                Cookies.set('accessToken', accessToken, { expires: 7 }); 
                Cookies.set('user', JSON.stringify(user), { expires: 7 }); 
                dispatch(setAccessToken(accessToken));
                dispatch(setUser(user));

                // Check if user already has complete information
                const userDetails = await getUserDetailById(user.id, accessToken);
                if (userDetails && userDetails.fullname && userDetails.age && userDetails.gender && userDetails.avatar_url) {
                    navigate('/home'); // Redirect to home if user info exists
                } else {
                    setIsUserInfoFormVisible(true); // Show user info form if details are incomplete
                }
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

    // Ensure avatar_url is properly set before submitting the form
    const handleUserInfoSubmit = async (e) => {
        e.preventDefault();
        const errors = validateUserInfo();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        try {
            const token = Cookies.get('accessToken');
            const userCookie = Cookies.get('user'); // Retrieve user cookie
            if (!userCookie) {
                console.error('User cookie is missing');
                setFormErrors({ general: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
                return;
            }
            const user = JSON.parse(userCookie); // Parse user object from cookie
            const userId = user.id; // Extract user ID from the user object

            // Ensure avatar_url is included in the userInfo
            const updatedUserInfo = {
                ...userInfo,
                user_id: userId,
                avatar_url: userInfo.avatar || '', // Use avatar field for avatar_url
            };

            console.log('User Info:', updatedUserInfo);

            const response = await createUserDetail(updatedUserInfo, token);
            console.log('User detail saved:', response);
            dispatch(setUser(updatedUserInfo));
            navigate('/home');
        } catch (error) {
            console.error('Error saving user detail:', error);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={10} lg={10}>
                    {!isUserInfoFormVisible ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <h1 className="text-center mb-4"
                                style={{
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 'bold',
                                    color: '#6a11cb',
                                    fontSize: '26px',
                                }}>
                                Nhập thông tin người dùng
                            </h1>
                            <Form
                                onSubmit={handleUserInfoSubmit}
                                style={{
                                    backgroundColor: '#f9f9f9',
                                    padding: '30px',
                                    borderRadius: '12px',
                                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                                }}
                            >
                                <Form.Group controlId="fullname" className="mb-3">
                                    <Form.Label style={{ fontWeight: 'bold' }}>Họ và tên</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Nhập họ và tên"
                                        required
                                        value={userInfo.fullname}
                                        onChange={(e) => setUserInfo({ ...userInfo, fullname: e.target.value })}
                                        style={{
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            padding: '12px',
                                        }}
                                    />
                                    {formErrors.fullname && <Alert variant="danger">{formErrors.fullname}</Alert>}
                                </Form.Group>

                                <Form.Group controlId="age" className="mb-3">
                                    <Form.Label style={{ fontWeight: 'bold' }}>Tuổi</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Nhập tuổi"
                                        required
                                        value={userInfo.age}
                                        onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                                        style={{
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            padding: '12px',
                                        }}
                                    />
                                    {formErrors.age && <Alert variant="danger">{formErrors.age}</Alert>}
                                </Form.Group>

                                <Form.Group controlId="gender" className="mb-3">
                                    <Form.Label style={{ fontWeight: 'bold' }}>Giới tính</Form.Label>
                                    <div>
                                        <Form.Check
                                            type="radio"
                                            id="male"
                                            name="gender"
                                            label="Nam"
                                            value={true}
                                            checked={userInfo.gender === true}
                                            onChange={() => setUserInfo({ ...userInfo, gender: true })}
                                            style={{ marginRight: '10px' }}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="female"
                                            name="gender"
                                            label="Nữ"
                                            value={false}
                                            checked={userInfo.gender === false}
                                            onChange={() => setUserInfo({ ...userInfo, gender: false })}
                                        />
                                    </div>
                                    {formErrors.gender && <Alert variant="danger">{formErrors.gender}</Alert>}
                                </Form.Group>

                                <Form.Group controlId="avatar" className="mb-3">
                                    <Form.Label style={{ fontWeight: 'bold' }}>Ảnh đại diện</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024) {
                                                    setFormErrors({ ...formErrors, avatar: 'Kích thước ảnh không được vượt quá 2MB' });
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    setUserInfo({ ...userInfo, avatar: reader.result });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        style={{
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            padding: '12px',
                                        }}
                                    />
                                    {formErrors.avatar && <Alert variant="danger">{formErrors.avatar}</Alert>}
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
                                    Lưu thông tin
                                </Button>
                            </Form>
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default LoginForm;
