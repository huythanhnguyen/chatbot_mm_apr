// src/services/wishlist-service.js
import axios from 'axios';
import authService from './auth-service';

// Hằng số cho localStorage
const WISHLIST_STORAGE_KEY = 'mm_wishlist_items';

class WishlistService {
  constructor() {
    this._wishlistItems = [];
    this._loadFromLocalStorage();
  }

  // Phương thức private để tải danh sách yêu thích từ localStorage
  _loadFromLocalStorage() {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        this._wishlistItems = JSON.parse(savedWishlist);
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      this._wishlistItems = [];
    }
  }

  // Phương thức private để lưu danh sách yêu thích vào localStorage
  _saveToLocalStorage() {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this._wishlistItems));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }

  // Lấy tất cả sản phẩm trong danh sách yêu thích
  getAll() {
    return [...this._wishlistItems];
  }

  // Kiểm tra xem một sản phẩm đã có trong danh sách yêu thích chưa
  isInWishlist(sku) {
    return this._wishlistItems.some(item => item.sku === sku);
  }

  // Thêm sản phẩm vào danh sách yêu thích
  add(product) {
    if (!product || !product.sku) {
      console.error('Cannot add invalid product to wishlist');
      return false;
    }

    // Kiểm tra nếu sản phẩm đã tồn tại, không thêm nữa
    if (this.isInWishlist(product.sku)) {
      return false;
    }

    // Chỉ lưu thông tin cần thiết của sản phẩm
    const wishlistItem = {
      id: product.id || Date.now().toString(),
      sku: product.sku,
      name: product.name,
      price: product.price_range?.maximum_price?.final_price?.value || 0,
      currency: product.price_range?.maximum_price?.final_price?.currency || 'VND',
      image: product.small_image?.url || '',
      timestamp: new Date().toISOString()
    };

    this._wishlistItems.push(wishlistItem);
    this._saveToLocalStorage();
    
    // Nếu người dùng đã đăng nhập, đồng bộ với server
    if (authService.isAuthenticated()) {
      this.syncWithAccount(authService.getToken());
    }
    
    return true;
  }

  // Xóa sản phẩm khỏi danh sách yêu thích
  remove(sku) {
    if (!sku) return false;

    const initialLength = this._wishlistItems.length;
    this._wishlistItems = this._wishlistItems.filter(item => item.sku !== sku);

    if (this._wishlistItems.length !== initialLength) {
      this._saveToLocalStorage();
      
      // Nếu người dùng đã đăng nhập, đồng bộ với server
      if (authService.isAuthenticated()) {
        this.syncWithAccount(authService.getToken());
      }
      
      return true;
    }

    return false;
  }

  // Toggle (thêm/xóa) sản phẩm trong danh sách yêu thích
  toggle(product) {
    if (!product || !product.sku) return false;

    if (this.isInWishlist(product.sku)) {
      return this.remove(product.sku);
    } else {
      return this.add(product);
    }
  }

  // Xóa tất cả sản phẩm khỏi danh sách yêu thích
  clear() {
    this._wishlistItems = [];
    this._saveToLocalStorage();
    
    // Nếu người dùng đã đăng nhập, đồng bộ với server
    if (authService.isAuthenticated()) {
      this.syncWithAccount(authService.getToken());
    }
  }

  // Lấy số lượng sản phẩm trong danh sách yêu thích
  get count() {
    return this._wishlistItems.length;
  }

  // Đồng bộ danh sách yêu thích với tài khoản đã đăng nhập (API)
  async syncWithAccount(authToken) {
    if (!authToken) return { success: false, error: 'Không có token xác thực' };

    try {
      // API endpoint
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'https://ai-agent-backend-18ql.onrender.com';
      
      // Gửi danh sách yêu thích hiện tại lên server
      const response = await axios.post(
        `${apiUrl}/wishlist/sync`, 
        { items: this._wishlistItems },
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );
      
      if (response.data && response.data.success) {
        // Nếu server trả về danh sách đã đồng bộ, cập nhật danh sách local
        if (response.data.wishlist) {
          this._wishlistItems = response.data.wishlist;
          this._saveToLocalStorage();
        }
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.data?.error || 'Đồng bộ danh sách yêu thích thất bại' 
      };
    } catch (error) {
      console.error('Error syncing wishlist with account:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Lỗi kết nối đến server' 
      };
    }
  }
}

export default new WishlistService();