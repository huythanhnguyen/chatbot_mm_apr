// src/services/auth-service.js
import axios from 'axios';

// Lấy API URL từ biến môi trường của Vite
const apiUrl = import.meta.env.VITE_BACKEND_URL || 'https://ai-agent-backend-18ql.onrender.com';

class AuthService {
  constructor() {
    // Lấy token từ localStorage nếu có
    this.token = localStorage.getItem('auth_token') || null;
    this.userEmail = localStorage.getItem('user_email') || null;
  }

  /**
   * Kiểm tra người dùng đã đăng nhập hay chưa
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Lấy thông tin người dùng đang đăng nhập
   */
  getCurrentUser() {
    return {
      email: this.userEmail
    };
  }

  /**
   * Lấy token xác thực
   */
  getToken() {
    return this.token;
  }

  /**
   * Đăng nhập với email và mật khẩu
   * @param {string} email Email người dùng
   * @param {string} password Mật khẩu
   * @returns {Promise<Object>} Kết quả đăng nhập
   */
  async login(email, password) {
    try {
      const response = await axios.post(`${apiUrl}/login`, { email, password });
      
      if (response.data && response.data.data && response.data.data.generateCustomerToken) {
        const token = response.data.data.generateCustomerToken.token;
        
        // Lưu token vào localStorage và biến instance
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_email', email);
        this.token = token;
        this.userEmail = email;
        
        return { success: true, token };
      } else if (response.data.errors) {
        // Xử lý lỗi từ API
        const error = response.data.errors[0]?.message || 'Đăng nhập thất bại';
        return { success: false, error };
      }
      
      return { success: false, error: 'Đăng nhập thất bại' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Lỗi kết nối đến server' 
      };
    }
  }

  /**
   * Đăng xuất người dùng
   */
  logout() {
    // Xóa token khỏi localStorage và biến instance
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    this.token = null;
    this.userEmail = null;
    
    return true;
  }

  /**
   * Thêm token xác thực vào header của request
   * @param {Object} config Cấu hình axios
   * @returns {Object} Cấu hình đã thêm header Authorization
   */
  getAuthHeader() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }
}

// Export single instance
export default new AuthService();