import axios from 'axios';

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
    return true;
  }

  // Xóa sản phẩm khỏi danh sách yêu thích
  remove(sku) {
    if (!sku) return false;

    const initialLength = this._wishlistItems.length;
    this._wishlistItems = this._wishlistItems.filter(item => item.sku !== sku);

    if (this._wishlistItems.length !== initialLength) {
      this._saveToLocalStorage();
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
  }

  // Lấy số lượng sản phẩm trong danh sách yêu thích
  get count() {
    return this._wishlistItems.length;
  }

  // Đồng bộ danh sách yêu thích với tài khoản đã đăng nhập (API)
  async syncWithAccount(authToken) {
    if (!authToken) return;

    try {
      // Đây là nơi bạn sẽ gọi API để đồng bộ danh sách yêu thích
      // với tài khoản đã đăng nhập

      // Ví dụ:
      // 1. Tải danh sách yêu thích từ server
      // 2. Kết hợp với danh sách cục bộ
      // 3. Lưu lại danh sách kết hợp

      // Mô phỏng API call (sẽ thay thế bằng mã thực tế)
      /*
      const response = await axios.get('/api/wishlist', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      // Kết hợp danh sách từ server với danh sách cục bộ
      const serverItems = response.data.items || [];
      const localItems = this._wishlistItems;

      // Logic kết hợp hai danh sách
      // ...

      // Lưu lại kết quả
      this._wishlistItems = combinedItems;
      this._saveToLocalStorage();
      */

      return true;
    } catch (error) {
      console.error('Error syncing wishlist with account:', error);
      return false;
    }
  }
}

export default new WishlistService();