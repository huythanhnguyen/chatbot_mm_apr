import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import mmLogo from '../assets/mm-logo.png'; // Thêm logo vào assets

const Sidebar = ({ 
  onNewChat, 
  chatHistory, 
  onSelectChat, 
  currentChatId, 
  onLogin, 
  isLoggedIn, 
  userInfo,
  wishlistItems = []
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Đóng sidebar khi click bên ngoài (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('.sidebar');
      const mobileButton = document.querySelector('.mobile-menu-button');
      
      if (sidebar && 
          isMobileMenuOpen && 
          !sidebar.contains(event.target) && 
          !mobileButton.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Nút hamburger menu cho mobile */}
      <button 
        className="mobile-menu-button" 
        onClick={toggleMobileMenu}
        aria-label="Menu"
      >
        <i className="fas fa-bars"></i>
      </button>

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <img 
            src={mmLogo} 
            alt="MM Logo" 
            className="sidebar-logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/40x40?text=MM';
            }}
          />
          <h2 className="sidebar-title">MM Shop</h2>
          {/* Nút đóng sidebar - chỉ hiện trên mobile */}
          <button 
            className="close-sidebar" 
            onClick={toggleMobileMenu}
            aria-label="Đóng menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="sidebar-actions">
          <button className="new-chat-button" onClick={onNewChat}>
            <i className="fas fa-plus"></i> Tạo cuộc trò chuyện mới
          </button>
        </div>

        {!isLoggedIn ? (
          <div className="sidebar-login">
            <button className="login-button" onClick={onLogin}>
              <i className="fas fa-sign-in-alt"></i> Đăng nhập
            </button>
          </div>
        ) : (
          <div className="user-info">
            <div className="avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <div className="user-name">{userInfo?.name || "Người dùng"}</div>
              <div className="user-email">{userInfo?.email || ""}</div>
            </div>
          </div>
        )}

        <div className="sidebar-section">
          <h3 className="section-title">Lịch sử trò chuyện</h3>
          <div className="chat-history">
            {chatHistory.length === 0 ? (
              <div className="empty-history">Không có lịch sử trò chuyện</div>
            ) : (
              <ul className="chat-list">
                {chatHistory.map((chat) => (
                  <li 
                    key={chat.id} 
                    className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <i className="fas fa-comment"></i>
                    <span className="chat-title">{chat.title || "Cuộc trò chuyện"}</span>
                    <span className="chat-date">{new Date(chat.timestamp).toLocaleDateString('vi-VN')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">Wishlist</h3>
          <div className="wishlist">
            {wishlistItems.length === 0 ? (
              <div className="empty-wishlist">Chưa có sản phẩm yêu thích</div>
            ) : (
              <ul className="wishlist-items">
                {wishlistItems.map((item) => (
                  <li key={item.sku} className="wishlist-item">
                    <i className="fas fa-heart"></i>
                    <span className="item-name">{item.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="version">MM Chat v1.0.0</div>
        </div>
      </div>

      {/* Overlay khi hiển thị sidebar trên mobile */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>
      )}
    </>
  );
};

export default Sidebar;