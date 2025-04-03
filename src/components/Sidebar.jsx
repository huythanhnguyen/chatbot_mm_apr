import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ 
  isOpen, 
  onClose, 
  user, 
  onLogin, 
  onLogout,
  chatHistory,
  onChatSelect,
  onNewChat,
  wishlist = [],
  cartItems = [],
  onViewCart,
  onViewWishlist
}) => {
  const [activeTab, setActiveTab] = useState('chats');

  // Xử lý việc đóng sidebar khi click ra ngoài trên mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.contains(event.target) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Render các tab khác nhau dựa trên activeTab
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
                    className="chat-history-item"
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
                cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">{item.price.toLocaleString()} VND</div>
                      <div className="cart-item-quantity">
                        <button className="quantity-btn">-</button>
                        <span>{item.quantity}</span>
                        <button className="quantity-btn">+</button>
                      </div>
                    </div>
                  </div>
                ))
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
              {wishlist && wishlist.length > 0 ? (
                wishlist.map((item) => (
                  <div key={item.id} className="wishlist-item">
                    <div className="wishlist-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="wishlist-item-info">
                      <div className="wishlist-item-name">{item.name}</div>
                      <div className="wishlist-item-price">{item.price.toLocaleString()} VND</div>
                      <button className="add-to-cart-btn">
                        <i className="fas fa-shopping-cart"></i> Thêm vào giỏ
                      </button>
                    </div>
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
      <div id="sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img 
            src="/mega-market-logo.png" 
            alt="MM Logo" 
            className="sidebar-logo"
            onError={(e) => {e.target.src = '/placeholder-logo.png'}}
          />
          <button className="close-sidebar-btn" onClick={onClose}>
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
          >
            <i className="fas fa-comment-alt"></i>
            <span>Chat</span>
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
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
          >
            <i className="fas fa-heart"></i>
            <span>Yêu thích</span>
            {wishlist && wishlist.length > 0 && (
              <span className="tab-badge">{wishlist.length}</span>
            )}
          </button>
        </div>

        <div className="user-profile">
          {user ? (
            <div className="user-info">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
              </div>
              <div className="user-details">
                <div className="user-name">{user.name || user.email}</div>
                <button className="logout-btn" onClick={onLogout}>
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