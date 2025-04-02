import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  const { name, sku, price_range, small_image } = product;
  
  const handleAddToCart = () => {
    onAddToCart(sku, 1);
  };
  
  return (
    <div className="product-card">
      {small_image && small_image.url && (
        <img src={small_image.url} alt={name} className="product-image" />
      )}
      
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        
        {price_range && price_range.maximum_price && (
          <p className="product-price">
            {price_range.maximum_price.final_price.value.toLocaleString()} 
            {price_range.maximum_price.final_price.currency}
          </p>
        )}
        
        <p className="product-sku">SKU: {sku}</p>
        
        <button className="add-to-cart-button" onClick={handleAddToCart}>
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
};

export default ProductCard;