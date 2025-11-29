import Axios from "axios";
import { toast } from "react-toastify";

// Định nghĩa base URL từ biến môi trường hoặc mặc định
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000/api/v1";

// Tạo instance của axios với base URL
const api = Axios.create({
  baseURL,
});

// Interceptor để thêm token vào header
api.interceptors.request.use((config) => {
  // Chuẩn hóa URL để tránh lặp lại baseURL
  if (config.url?.startsWith("/api/v1")) {
    config.url = config.url.replace("/api/v1", "");
  }

  // Logging để debug
  console.log("API Request:", config.url, config.method);

  const token = localStorage.getItem(config.url?.includes("/admin") ? "adminToken" : "token");
  const pathsWithoutToken = [
    "/users/login",
    "/users/register",
    "/users/password/forgot",
    "/admin/accounts/login",
  ];

  if (token && !pathsWithoutToken.some((path) => config.url?.includes(path))) {
    config.headers["Authorization"] = `Bearer ${token}`;
    console.log("Token added to request:", token);
  } else {
    console.log("No token added to request");
  }

  return config;
});

// Xử lý lỗi toàn cục
api.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.config.url}]:`, response.status, response.data);
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || "Lỗi không xác định";
    const status = error.response?.status;

    console.error(`API Error [${error.config.url}]:`, status, errorMessage);

    if (status === 401) {
      // Xử lý lỗi 401 (phiên hết hạn)
      if (error.config.url?.includes("/admin")) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        window.location.href = "/loginadmin";
      } else {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("cartId");
        window.location.href = "/login";
      }
    } else if (status === 429) {
      // Xử lý lỗi 429 (Too Many Requests)
      const retryAfter = error.response?.headers?.["retry-after"];
      const message = retryAfter 
        ? `Quá nhiều yêu cầu! Vui lòng thử lại sau ${retryAfter} giây.`
        : "Quá nhiều yêu cầu! Vui lòng thử lại sau.";
      toast.error(message);
    } else if (status === 404) {
      // Xử lý lỗi 404 mà không hiển thị toast (để frontend tự xử lý nếu cần)
      console.log(`API 404: Tài nguyên không tồn tại - ${error.config.url}`);
    } else if (status === 400) {
      // Hiển thị thông báo lỗi 400 (Bad Request)
      toast.error(errorMessage);
    } else {
      // Các lỗi khác (500, v.v.)
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
