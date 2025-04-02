import axios from 'axios';

// Thay thế dòng khai báo BASE_URL
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
      const response = await axios.post(`${BASE_URL}/cart/create`, 
        { customer_token: customerToken });
      return response.data;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(cartId, sku, quantity = 1, authToken = null) {
    const config = {};
    if (authToken) {
      config.headers = { 'Authorization': `Bearer ${authToken}` };
    }
    
    try {
      const response = await axios.post(`${BASE_URL}/cart/add`, 
        { cart_id: cartId, sku, quantity },
        config
      );
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Lấy thông tin giỏ hàng
  async getCart(cartId, authToken = null) {
    const config = {};
    if (authToken) {
      config.headers = { 'Authorization': `Bearer ${authToken}` };
    }
    
    try {
      const response = await axios.get(`${BASE_URL}/cart/${cartId}`, config);
      return response.data;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  }

  // Bắt đầu thanh toán
  async startCheckout(cartId) {
    try {
      const response = await axios.post(`${BASE_URL}/checkout/start`, { cart_id: cartId });
      return response.data;
    } catch (error) {
      console.error('Error starting checkout:', error);
      throw error;
    }
  }
}

export default new BackendService();