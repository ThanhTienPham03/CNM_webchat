import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { getUserDetailById } from '../../services/userService';

const useCheckUserInfo = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserInfo = async () => {
            const accessToken = Cookies.get('accessToken');
            if (accessToken) {
                try {
                    const userCookie = Cookies.get('user');
                    if (userCookie) {
                        const user = JSON.parse(userCookie);
                        const userDetails = await getUserDetailById(user.id, accessToken);
                        if (userDetails && userDetails.fullname && userDetails.age && userDetails.gender && userDetails.avatar_url) {
                            navigate('/home'); // Redirect to home if user info exists
                        }
                    }
                } catch (err) {
                    console.error('Error checking user info:', err);
                }
            }
        };
        checkUserInfo();
    }, [navigate]);
};

export default useCheckUserInfo;