// src/components/ChatLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import './ChatLayout.css';

const ChatLayout = ({ 
  children, 
  onNewChat, 
  chatHistory, 
  onSelectChat, 
  currentChatId, 
  onLogin, 
  isLoggedIn, 
  userInfo 
}) => {
  return (
    <div className="chat-layout">
      <Sidebar 
        onNewChat={onNewChat}
        chatHistory={chatHistory}
        onSelectChat={onSelectChat}
        currentChatId={currentChatId}
        onLogin={onLogin}
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
      />
      <main className="chat-main">
        {children}
      </main>
    </div>
  );
};

export default ChatLayout;