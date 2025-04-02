// src/components/CartView.jsx
import React from 'react';
import './CartView.css';

const CartView = ({ cartData, onClose, onCheckout }) => {
  if (!cartData || !cartData.data || !cartData.data.cart) {
    return (
      <div className="cart-view-container">
        <div className="cart-view-header">
          <h3 className="cart-view-title">Giỏ hàng của bạn</h3>
          <button className="cart-close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="cart-empty">
          <i className="fas fa-shopping-cart cart-empty-icon"></i>
          <p>Giỏ hàng của bạn đang trống</p>
        </div>
      </div>
    );
  }

  const { items = [] } = cartData.data.cart;
  const grandTotal = cartData.data.cart.prices?.grand_total || { value: 0, currency: 'VND' };
  
  // Format giá
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };
  
  return (
    <div className="cart-view-container">
      <div className="cart-view-header">
        <h3 className="cart-view-title">Giỏ hàng của bạn</h3>
        <button className="cart-close-button" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="cart-items">
        {items.length === 0 ? (
          <div className="cart-empty">
            <i className="fas fa-shopping-cart cart-empty-icon"></i>
            <p>Giỏ hàng của bạn đang trống</p>
          </div>
        ) : (
          <>
            {items.map(item => {
              const product = item.product;
              const price = item.prices?.price || { value: 0, currency: 'VND' };
              const totalItemPrice = price.value * item.quantity;
              
              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    <img 
                      src={product.small_image?.url || '/placeholder-image.png'} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{product.name}</h4>
                    <p className="cart-item-sku">SKU: {product.sku}</p>
                    <div className="cart-item-details">
                      <span className="cart-item-price">{formatPrice(price.value)} {price.currency}</span>
                      <span className="cart-item-quantity">x {item.quantity}</span>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    {formatPrice(totalItemPrice)} {price.currency}
                  </div>
                </div>
              );
            })}
            
            <div className="cart-summary">
              <div className="cart-total">
                <span>Tổng cộng:</span>
                <span className="cart-total-price">{formatPrice(grandTotal.value)} {grandTotal.currency}</span>
              </div>
              <button className="checkout-button" onClick={onCheckout}>
                <i className="fas fa-credit-card"></i> Thanh toán
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartView;