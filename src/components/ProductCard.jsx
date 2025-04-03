// src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import './ProductCard.css';
import wishlistService from '../services/wishlist-service';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onViewDetails
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const { 
    name, 
    sku, 
    price_range, 
    small_image 
  } = product;

  // Kiểm tra sản phẩm có trong wishlist không
  useEffect(() => {
    setIsInWishlist(wishlistService.isInWishlist(sku));
  }, [sku]);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      await onAddToCart(sku, quantity);
      // Hiệu ứng thành công
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 1000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setIsAddingToCart(false);
    }
  };

  const handleViewDetails = () => {
    onViewDetails(sku);
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (isTogglingWishlist) return;

    setIsTogglingWishlist(true);
    try {
      const result = wishlistService.toggle(product);
      setIsInWishlist(wishlistService.isInWishlist(sku));
      setTimeout(() => {
        setIsTogglingWishlist(false);
      }, 500);
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      setIsTogglingWishlist(false);
    }
  };

  const incrementQuantity = (e) => {
    e.stopPropagation();
    if (quantity < 99) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = (e) => {
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Tính toán giá và khuyến mãi
  const priceInfo = price_range?.maximum_price;
  const finalPrice = priceInfo?.final_price;
  const discount = priceInfo?.discount;
  
  const formattedPrice = finalPrice ? 
    new Intl.NumberFormat('vi-VN').format(finalPrice.value) + ' ' + finalPrice.currency : 
    'Liên hệ';

  return (
    <div className="product-card" onClick={handleViewDetails}>
      {/* Badge khuyến mãi */}
      {discount && discount.percent_off > 0 && (
        <div className="discount-badge">-{discount.percent_off.toFixed(0)}%</div>
      )}
      
      {/* Nút yêu thích */}
      <button 
        className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
        onClick={handleToggleWishlist}
        aria-label={isInWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
      >
        {isTogglingWishlist ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className={`${isInWishlist ? 'fas' : 'far'} fa-heart`}></i>
        )}
      </button>
      
      {/* Ảnh sản phẩm */}
      <div className="product-image-container">
        <img 
          src={small_image?.url || '/placeholder-product.png'} 
          alt={name} 
          className="product-thumbnail"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'}}
        />
      </div>
      
      {/* Thông tin sản phẩm */}
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <p className="product-sku">Mã: {sku}</p>
        <p className="product-price">{formattedPrice}</p>
        
        {/* Bộ chọn số lượng và nút thêm vào giỏ */}
        <div className="product-actions">
          <div className="quantity-selector">
            <button 
              className="quantity-btn" 
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              aria-label="Giảm số lượng"
            >
              -
            </button>
            <span className="quantity">{quantity}</span>
            <button 
              className="quantity-btn" 
              onClick={incrementQuantity}
              disabled={quantity >= 99}
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
          
          <button 
            className="add-to-cart-btn" 
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            aria-label="Thêm vào giỏ hàng"
          >
            {isAddingToCart ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-shopping-cart"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;