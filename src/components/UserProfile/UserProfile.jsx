import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getUserDetailById } from '../../services/userService';
import Cookies from 'js-cookie';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { Alert, Spinner, Form, Button } from 'react-bootstrap';
import { fetchUserDetail } from '../../api/userDetailsAPI';
import { useNavigate } from 'react-router-dom';

const UserProfile = ({ userId }) => {
  const navigate = useNavigate();
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tempUser, setTempUser] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [reload, setReload] = useState(false); // State to trigger re-render

  useEffect(() => {
    const fetchUserDetail = async () => {
      const accessToken = Cookies.get('accessToken');
      if (!accessToken) {
        setError('Missing access token. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const idToFetch = userId || JSON.parse(Cookies.get('user')).id;
        const detail = await getUserDetailById(idToFetch, accessToken);
        setUserDetail(detail);
        setTempUser(detail);
      } catch (err) {
        setError('Failed to fetch user details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [userId, reload]); // Add reload as a dependency

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setTempUser((prev) => ({ ...prev, avatarFile: file }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!tempUser.fullname || !tempUser.age) {
      setError('Họ tên và tuổi không được để trống.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!userDetail || !userDetail.user_id) {
      setError('User ID is missing. Please refresh the page and try again.');
      setLoading(false);
      return;
    }

    try {
      const accessToken = Cookies.get('accessToken');
      if (!accessToken) throw new Error('No access token');

      const formData = new FormData();
      formData.append('fullname', tempUser.fullname);
      formData.append('age', tempUser.age.toString());
      formData.append('gender', tempUser.gender);

      if (tempUser.avatarFile) {
        formData.append('avatar', tempUser.avatarFile);
      }

      const response = await fetch(`http://localhost:3000/api/userDetails/update/${userDetail.user_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cập nhật thất bại. Vui lòng thử lại.');
      }

      setSuccessMessage('Cập nhật thành công!');
      setEditing(false);
      setAvatarPreview(null);
      setReload(!reload); // Trigger re-render by toggling reload state

      // Navigate to home page to reload it
      navigate('/home');
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  const genderOptions = [
    { label: 'Nam', value: true },
    { label: 'Nữ', value: false },
  ];

  return (
    <div
      className="container p-4"
      style={{
        maxWidth: '400px',
        background: '#fff',
        borderRadius: '15px',
        boxShadow: '0 4px 8px rgba(133, 25, 227, 0.3)',
      }}
    >
      <h2 className="text-center mb-4" style={{ fontWeight: 'bold', color: 'black' }}>
        Thông tin tài khoản
      </h2>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="position-relative mb-4 text-center">
        <label htmlFor="avatarUpload" style={{ cursor: 'pointer' }}>
          <img
            src={avatarPreview || userDetail?.avatar_url || 'default-avatar.png'}
            alt="User Avatar"
            className="rounded-circle"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              border: '3px solid #6a11cb',
            }}
          />
        </label>
        {editing && (
          <input
            type="file"
            id="avatarUpload"
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleAvatarChange}
          />
        )}
      </div>

      {!editing ? (
        <>
          <h4 className="text-center mb-3" style={{ fontWeight: 'bold', color: 'black' }}>
            {userDetail?.fullname}
            <button className="btn btn-link ms-2" onClick={() => setEditing(true)}>
              <FaEdit />
            </button>
          </h4>
          <div>
            <p style={{ color: 'black' }}>
              <strong>Giới tính:</strong> {userDetail?.gender ? 'Nam' : 'Nữ'}
            </p>
            <p style={{ color: 'black' }}>
              <strong>Tuổi:</strong> {userDetail?.age}
            </p>
            <p style={{ color: 'black' }}>
              <strong>Điện thoại:</strong> {userDetail?.phone || 'Chưa cập nhật'}
            </p>
            <p style={{ color: 'black' }}>
              <strong>Email:</strong> {userDetail?.email || 'Chưa cập nhật'}
            </p>
          </div>
        </>
      ) : (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Họ tên</Form.Label>
            <Form.Control
              type="text"
              name="fullname"
              value={tempUser.fullname}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tuổi</Form.Label>
            <Form.Control
              type="number"
              name="age"
              value={tempUser.age}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Giới tính</Form.Label>
            <Form.Select name="gender" value={tempUser.gender} onChange={handleInputChange}>
              {genderOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button variant="success" onClick={handleSave}>
              <FaSave className="me-1" /> Lưu
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              <FaTimes className="me-1" /> Hủy
            </Button>
            <Button variant="warning" onClick={() => navigate('/changePassword')}>
              Đổi mật khẩu
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
