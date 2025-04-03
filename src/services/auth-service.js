// src/services/auth-service.js
import axios from 'axios';

// Lấy API URL từ biến môi trường của Vite
const apiUrl = import.meta.env.VITE_BACKEND_URL || 'https://ai-agent-backend-18ql.onrender.com';

class AuthService {
  constructor() {
    // Lấy token từ localStorage nếu có
    this.token = localStorage.getItem('auth_token') || null;
    this.userInfo = JSON.parse(localStorage.getItem('user_info')) || null;
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
    return this.userInfo;
  }

  /**
   * Lấy token xác thực
   */
  getToken() {
    return this.token;
  }

  /**
   * Đăng ký tài khoản mới
   * @param {string} name Tên người dùng
   * @param {string} email Email
   * @param {string} password Mật khẩu
   * @returns {Promise<Object>} Kết quả đăng ký
   */
  async register(name, email, password) {
    try {
      const response = await axios.post(`${apiUrl}/register`, { 
        name, 
        email, 
        password 
      });
      
      if (response.data && response.data.success) {
        return { success: true };
      } else if (response.data.errors) {
        // Xử lý lỗi từ API
        const error = response.data.errors[0]?.message || 'Đăng ký thất bại';
        return { success: false, error };
      }
      
      return { success: false, error: 'Đăng ký thất bại' };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Lỗi kết nối đến server' 
      };
    }
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
        
        // Lấy thông tin người dùng
        await this.fetchUserInfo(token);
        
        // Lưu token vào localStorage và biến instance
        localStorage.setItem('auth_token', token);
        this.token = token;
        
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
   * Lấy thông tin người dùng từ server
   * @param {string} token Token xác thực 
   */
  async fetchUserInfo(token) {
    try {
      const response = await axios.get(`${apiUrl}/user-info`, {
        headers: { 
          'Authorization': `Bearer ${token || this.token}` 
        }
      });
      
      if (response.data && response.data.success) {
        const userInfo = response.data.user;
        this.userInfo = userInfo;
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        return userInfo;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Đăng xuất người dùng
   */
  logout() {
    // Xóa token và thông tin người dùng khỏi localStorage và biến instance
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    this.token = null;
    this.userInfo = null;
    
    return true;
  }

  /**
   * Thêm token xác thực vào header của request
   * @returns {Object} Header chứa token
   */
  getAuthHeader() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }
}

// Export single instance
export default new AuthService();