import React from 'react';
import './Header.css';

const Header = ({ 
  onToggleSidebar, 
  user,
  cartCount = 0,
  wishlistCount = 0,
  onViewCart,
  onViewWishlist,
  onNewChat
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={onToggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        <div className="logo-container">
          <img 
            src="/mega-market-logo.png" 
            alt="Mega Market" 
            className="logo"
            onError={(e) => { e.target.src = '/placeholder-logo.png'; }}
          />
        </div>
        <div className="app-title">
          <h1>MM Shop</h1>
          <p className="app-subtitle">Trợ lý tìm kiếm thông minh</p>
        </div>
      </div>
      
      <div className="header-right">
        <button className="action-button new-chat-btn" onClick={onNewChat} title="Tạo cuộc trò chuyện mới">
          <i className="fas fa-plus"></i>
          <span className="action-text">Tạo mới</span>
        </button>
        
        <button className="action-button" onClick={onViewWishlist} title="Danh sách yêu thích">
          <i className="far fa-heart"></i>
          {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          <span className="action-text">Yêu thích</span>
        </button>
        
        <button className="action-button" onClick={onViewCart} title="Giỏ hàng">
          <i className="fas fa-shopping-cart"></i>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
          <span className="action-text">Giỏ hàng</span>
        </button>
        
        {user ? (
          <div className="user-profile-mini">
            <div className="user-avatar-mini">
              {user.name ? user.name.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
            </div>
            <span className="username-mini">{user.displayName || user.email || 'Người dùng'}</span>
          </div>
        ) : (
          <button className="login-button-mini">
            <i className="fas fa-sign-in-alt"></i>
            <span className="action-text">Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;