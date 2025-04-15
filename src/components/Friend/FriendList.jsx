import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { FaSearch } from 'react-icons/fa'; // Import search icon
import {
  fetchFriends,
  fetchPendingRequests,
  sendFriendRequest,
  acceptFriendRequest
} from '../../redux/slices/friendSlice';

export const FriendList = () => {
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.friends.friends);
  const pending = useSelector((state) => state.friends.friendRequests);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  return (
    <div>
      <h2>Bạn bè</h2>
      <div className="search-bar">
        <FaSearch style={{ marginRight: '8px' }} />
        <input type="text" placeholder="Tìm kiếm bạn bè..." style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
      </div>
      {friends.map((f) => (
        <div key={f.friend_id}>{f.name || f.friend_id}</div>
      ))}

      <h2>Lời mời kết bạn</h2>
      {pending.map((req) => (
        <div key={req.friend_id}>
          {req.senderName || req.friend_id}
          <button onClick={() => dispatch(acceptFriendRequest({ userId: req.user_id, friendId: req.friend_id }))}>
            Chấp nhận
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendList;