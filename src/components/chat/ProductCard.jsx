import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onViewDetails, onAddToCart }) => {
  if (!product) return null;
  
  // Xử lý giá sản phẩm
  const price = product.price_range?.maximum_price?.final_price;
  const discount = product.price_range?.maximum_price?.discount;
  
  // Format giá tiền theo định dạng Việt Nam
  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };
  
  return (
    <div className="chat-product-card">
      <div className="chat-product-image">
        <img 
          src={product.small_image?.url || 'https://via.placeholder.com/150'} 
          alt={product.name} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
          }}
        />
        {discount && discount.percent_off > 0 && (
          <span className="chat-product-discount">-{Math.round(discount.percent_off)}%</span>
        )}
      </div>
      
      <div className="chat-product-info">
        <h4 className="chat-product-name">{product.name}</h4>
        <p className="chat-product-sku">SKU: {product.sku}</p>
        
        <div className="chat-product-price">
          {price ? (
            <span className="chat-price-amount">
              {formatPrice(price.value)} {price.currency}
            </span>
          ) : (
            <span className="chat-price-unavailable">Liên hệ</span>
          )}
        </div>
        
        <div className="chat-product-actions">
          <button 
            className="chat-product-details-btn"
            onClick={() => onViewDetails(product.sku)}
          >
            Xem chi tiết
          </button>
          
          <button 
            className="chat-product-cart-btn"
            onClick={() => onAddToCart(product.sku, 1)}
          >
            <i className="fas fa-shopping-cart"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;