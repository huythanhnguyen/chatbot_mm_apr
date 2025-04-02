// src/components/ProductDetail.jsx
import React, { useState } from 'react';
import './ProductDetail.css';

const ProductDetail = ({ product, onAddToCart, onBack }) => {
  const [quantity, setQuantity] = useState(1);
  
  if (!product) {
    return <div className="product-detail-loading">Đang tải thông tin sản phẩm...</div>;
  }
  
  const { name, sku, description, price_range, small_image, unit_ecom } = product;
  const finalPrice = price_range?.maximum_price?.final_price;
  const discount = price_range?.maximum_price?.discount;
  
  const handleAddToCart = () => {
    if (onAddToCart) onAddToCart(sku, quantity);
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };
  
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };
  
  // Format giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };
  
  // Format HTML description
  const createMarkup = (html) => {
    return { __html: html };
  };
  
  return (
    <div className="product-detail-container">
      <div className="product-detail-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Quay lại
        </button>
        <h3 className="product-detail-title">Chi tiết sản phẩm</h3>
      </div>
      
      <div className="product-detail-content">
        <div className="product-detail-image">
          <img 
            src={small_image?.url || '/placeholder-image.png'} 
            alt={name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
          {discount && discount.percent_off > 0 && (
            <span className="product-detail-discount">-{Math.round(discount.percent_off)}%</span>
          )}
        </div>
        
        <div className="product-detail-info">
          <h4 className="product-detail-name">{name}</h4>
          <p className="product-detail-sku">SKU: {sku}</p>
          
          {finalPrice && (
            <div className="product-detail-price">
              <span className="final-price">{formatPrice(finalPrice.value)} {finalPrice.currency}</span>
            </div>
          )}
          
          {unit_ecom && (
            <p className="product-detail-unit">Đơn vị: {unit_ecom}</p>
          )}
          
          <div className="product-detail-actions">
            <div className="quantity-selector">
              <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <button className="quantity-btn" onClick={increaseQuantity}>+</button>
            </div>
            
            <button className="product-detail-add-to-cart" onClick={handleAddToCart}>
              <i className="fas fa-shopping-cart"></i> Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
      
      {description && description.html && (
        <div className="product-detail-description">
          <h5 className="description-title">Mô tả sản phẩm</h5>
          <div 
            className="description-content"
            dangerouslySetInnerHTML={createMarkup(description.html)} 
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;