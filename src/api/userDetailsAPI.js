
const USER_DETAIL_API = "http://localhost:3000/api/userDetails";


export const fetchUserDetail = async (user_id, accessToken) => {
  if (!user_id || !accessToken) {
    throw new Error("Invalid user_id or accessToken");
  }

  try {
    const response = await fetch(`${USER_DETAIL_API}/${user_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi lấy thông tin người dùng");
    }
    // console.log(response);
    // console.log("User detail response:", response);
    return await response.json();
  } catch (err) {
    console.error("Fetch user detail error:",err.message || err);
    //nếu status là 401 thì yêu cầu đăng nhập lại
    if (err.response && err.response.status === 401) {
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    throw err;
  }
};
