import axios from 'axios';
import AuthService from './auth-service';

// Lấy API URL từ biến môi trường của Vite
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://ai-agent-backend-18ql.onrender.com';

class BackendService {
  // Tìm kiếm sản phẩm
  async searchProducts(keyword) {
    try {
      const response = await axios.post(`${BASE_URL}/search`, { keyword });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Lấy chi tiết sản phẩm
  async getProductDetails(sku) {
    try {
      const response = await axios.get(`${BASE_URL}/product/${sku}`);
      return response.data;
    } catch (error) {
      console.error('Error getting product details:', error);
      throw error;
    }
  }

  // Tạo giỏ hàng
  async createCart(customerToken = null) {
    try {
      const headers = customerToken ? 
        { 'Authorization': `Bearer ${customerToken}` } : {};
        
      const response = await axios.post(`${BASE_URL}/cart/create`, 
        { customer_token: customerToken },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(cartId, sku, quantity = 1, authToken = null) {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
      const response = await axios.post(`${BASE_URL}/cart/add`, 
        { cart_id: cartId, sku, quantity },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Lấy thông tin giỏ hàng
  async getCart(cartId, authToken = null) {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
      const response = await axios.get(`${BASE_URL}/cart/${cartId}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  }

  // Bắt đầu thanh toán
  async startCheckout(cartId) {
    try {
      // Thêm token xác thực nếu đã đăng nhập
      const headers = {};
      const authToken = AuthService.getToken();
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await axios.post(
        `${BASE_URL}/checkout/start`, 
        { cart_id: cartId },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting checkout:', error);
      throw error;
    }
  }
}

export default new BackendService();