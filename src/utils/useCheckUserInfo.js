import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { getUserDetailById } from '../../services/userService';

const useCheckUserInfo = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserInfo = async () => {
            const accessToken = Cookies.get('accessToken');
            console.log('Access Token:', accessToken);
            if (accessToken) {
                try {
                    const userCookie = Cookies.get('user');
                    console.log('User Cookie:', userCookie);
                    if (userCookie) {
                        const user = JSON.parse(userCookie);
                        console.log('Parsed User:', user);
                        const userDetails = await getUserDetailById(user.id, accessToken);
                        console.log('Fetched User Details:', userDetails);

                        // Ensure all required fields are present and valid
                        if (
                            userDetails &&
                            userDetails.fullname &&
                            userDetails.age &&
                            (userDetails.gender === true || userDetails.gender === false) &&
                            userDetails.avatar_url
                          ) {
                            navigate('/home');
                          }
                    }
                } catch (error) {
                    console.error('Error checking user info:', error);
                }
        };
        checkUserInfo();
    };
    }, [navigate]);
};

export default useCheckUserInfo;