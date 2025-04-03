// Sửa đổi cho ChatLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import './ChatLayout.css';

const ChatLayout = ({ 
  children, 
  onNewChat, 
  chatHistory, 
  onSelectChat, 
  currentChatId, // Đảm bảo nhận prop này từ component cha
  onLogin, 
  isLoggedIn, 
  userInfo,
  wishlist = [], // Đổi tên từ wishlistItems nếu cần
}) => {
  return (
    <div className="chat-layout">
      <Sidebar 
        isOpen={true} // hoặc truyền một state để kiểm soát
        onClose={() => {}} // Thêm hàm xử lý đóng sidebar nếu cần
        onNewChat={onNewChat}
        chatHistory={chatHistory}
        onChatSelect={onSelectChat}
        currentChatId={currentChatId} // Truyền xuống Sidebar
        onLogin={onLogin}
        isLoggedIn={isLoggedIn}
        user={userInfo}
        wishlist={wishlist} // Đảm bảo tên prop đúng
        cartItems={[]} // Thêm mảng rỗng mặc định nếu không có
      />
      <main className="chat-main">
        {children}
      </main>
    </div>
  );
};

export default ChatLayout;