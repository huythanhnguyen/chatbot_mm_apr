// src/components/ProductCard.jsx
import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onViewDetails, onAddToCart }) => {
  const { name, sku, price_range, small_image } = product;
  
  const handleViewDetails = () => {
    if (onViewDetails) onViewDetails(sku);
  };
  
  const handleAddToCart = (e) => {
    e.stopPropagation(); // Ngăn việc kích hoạt handleViewDetails
    if (onAddToCart) onAddToCart(sku, 1);
  };
  
  // Format giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };
  
  const finalPrice = price_range?.maximum_price?.final_price;
  const discount = price_range?.maximum_price?.discount;
  
  return (
    <div className="product-card" onClick={handleViewDetails}>
      {discount && discount.percent_off > 0 && (
        <span className="discount-badge">-{Math.round(discount.percent_off)}%</span>
      )}
      
      <div className="product-image-container">
        <img 
          src={small_image?.url || '/placeholder-image.png'} 
          alt={name} 
          className="product-thumbnail"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
          }}
        />
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <p className="product-sku">SKU: {sku}</p>
        {finalPrice && (
          <p className="product-price">{formatPrice(finalPrice.value)} {finalPrice.currency}</p>
        )}
        
        <button 
          className="add-to-cart-button" 
          onClick={handleAddToCart}
        >
          <i className="fas fa-shopping-cart"></i> Thêm vào giỏ
        </button>
      </div>
    </div>
  );
};

export default ProductCard;