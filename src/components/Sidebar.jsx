// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import authService from '../services/auth-service';

const Sidebar = ({ 
  isOpen, 
  onClose, 
  user, 
  onLogin, 
  onLogout,
  chatHistory,
  onChatSelect,
  onNewChat,
  currentChatId, // Thêm dòng này - thiếu prop này
  wishlist = [],
  cartItems = [],
  onViewCart,
  onViewWishlist
}) => {
  const [activeTab, setActiveTab] = useState('chats');
  const sidebarRef = useRef(null);
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // Xử lý việc đóng sidebar khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Xử lý đăng xuất
  const handleLogout = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    }
  };

  // Format thời gian chat
  const formatChatTime = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Tính tổng tiền giỏ hàng
  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

   // Trong phần sử dụng currentChatId
   const renderTabContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h3>Lịch sử trò chuyện</h3>
              <button className="new-chat-btn" onClick={onNewChat}>
                <i className="fas fa-plus"></i> Tạo mới
              </button>
            </div>
            <div className="chat-history-list">
              {chatHistory && chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`chat-history-item ${chat.id === currentChatId ? 'active' : ''}`}
                    onClick={() => onChatSelect(chat.id)}
                  >
                    <i className="fas fa-comment"></i>
                    <div className="chat-history-info">
                      <div className="chat-history-title">{chat.title || 'Trò chuyện không tiêu đề'}</div>
                      <div className="chat-history-date">{new Date(chat.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-comments"></i>
                  <p>Chưa có lịch sử trò chuyện</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'cart':
        return (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h3>Giỏ hàng</h3>
              <button className="view-all-btn" onClick={onViewCart}>
                <i className="fas fa-external-link-alt"></i> Xem tất cả
              </button>
            </div>
            <div className="cart-list">
              {cartItems && cartItems.length > 0 ? (
                <>
                  {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-image">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          onError={(e) => {e.target.src = '/placeholder-image.png'}}
                        />
                      </div>
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">{item.price.toLocaleString()} đ</div>
                        <div className="cart-item-quantity">
                          <button 
                            className="quantity-btn"
                            onClick={() => onUpdateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >-</button>
                          <span>{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => onUpdateCartQuantity(item.id, item.quantity + 1)}
                          >+</button>
                        </div>
                      </div>
                      <button 
                        className="remove-item-btn"
                        onClick={() => onRemoveFromCart(item.id)}
                        title="Xóa khỏi giỏ hàng"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  
                  <div className="cart-total">
                    <span>Tổng cộng:</span>
                    <span className="total-amount">{calculateCartTotal().toLocaleString()} đ</span>
                  </div>
                  
                  <button className="checkout-btn" onClick={onViewCart}>
                    <i className="fas fa-shopping-cart"></i> Thanh toán
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-shopping-cart"></i>
                  <p>Giỏ hàng trống</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'wishlist':
        return (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h3>Danh sách yêu thích</h3>
              <button className="view-all-btn" onClick={onViewWishlist}>
                <i className="fas fa-external-link-alt"></i> Xem tất cả
              </button>
            </div>
            <div className="wishlist-items">
              {wishlistItems && wishlistItems.length > 0 ? (
                wishlistItems.map((item) => (
                  <div key={item.id} className="wishlist-item">
                    <div className="wishlist-item-image">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        onError={(e) => {e.target.src = '/placeholder-image.png'}}
                      />
                    </div>
                    <div className="wishlist-item-info">
                      <div className="wishlist-item-name">{item.name}</div>
                      <div className="wishlist-item-price">{item.price.toLocaleString()} đ</div>
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => item.addToCart && item.addToCart(item.sku, 1)}
                      >
                        <i className="fas fa-shopping-cart"></i> Thêm vào giỏ
                      </button>
                    </div>
                    <button 
                      className="remove-item-btn"
                      onClick={() => item.removeFromWishlist && item.removeFromWishlist(item.id)}
                      title="Xóa khỏi yêu thích"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-heart"></i>
                  <p>Chưa có sản phẩm yêu thích</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`}>
      <div ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img 
            src="/mega-market-logo.png" 
            alt="MM Logo" 
            className="sidebar-logo"
            onError={(e) => {e.target.src = 'https://via.placeholder.com/120x40?text=MM+Logo'}}
          />
          <button className="close-sidebar-btn" onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="sidebar-content">
          {renderTabContent()}
        </div>

        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
            aria-label="Lịch sử trò chuyện"
          >
            <i className="fas fa-comment-alt"></i>
            <span>Chat</span>
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
            aria-label="Giỏ hàng"
          >
            <i className="fas fa-shopping-cart"></i>
            <span>Giỏ hàng</span>
            {cartItems && cartItems.length > 0 && (
              <span className="tab-badge">{cartItems.length}</span>
            )}
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
            aria-label="Danh sách yêu thích"
          >
            <i className="fas fa-heart"></i>
            <span>Yêu thích</span>
            {wishlistItems && wishlistItems.length > 0 && (
              <span className="tab-badge">{wishlistItems.length}</span>
            )}
          </button>
        </div>

        <div className="user-profile">
          {isAuthenticated && currentUser ? (
            <div className="user-info">
              <div className="user-avatar">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 
                 currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 
                 <i className="fas fa-user"></i>}
              </div>
              <div className="user-details">
                <div className="user-name">{currentUser.name || currentUser.email}</div>
                <button className="logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <button className="login-btn" onClick={onLogin}>
              <i className="fas fa-sign-in-alt"></i> Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;