// src/components/ProductList.jsx
import React from 'react';
import ProductCard from './ProductCard';
import './ProductList.css';

const ProductList = ({ products, onViewDetails, onAddToCart }) => {
  if (!products || products.length === 0) {
    return <p className="no-products">Không tìm thấy sản phẩm nào.</p>;
  }

  return (
    <div className="product-list-container">
      <h4 className="product-list-title">Sản phẩm được tìm thấy</h4>
      <div className="product-list">
        {products.map((product) => (
          <ProductCard 
            key={product.sku} 
            product={product} 
            onViewDetails={onViewDetails}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;