import React, { useState, useRef } from 'react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, onFileUpload }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setIsTyping(false);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileUpload(files);
    }
    // Reset input để cùng một file có thể được chọn lại nếu cần
    e.target.value = "";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-wrapper">
          <button 
            type="button" 
            className="file-upload-button" 
            onClick={handleFileButtonClick}
            title="Tải lên file"
          >
            <i className="fas fa-plus"></i>
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            onChange={handleFileChange}
            accept=".txt,.xlsx,.xls,.csv"
            multiple
          />
          <input
            type="text"
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn..."
            className="chat-input"
          />
          {isTyping && (
            <button 
              type="button" 
              className="clear-button" 
              onClick={() => {
                setMessage('');
                setIsTyping(false);
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <button 
          type="submit" 
          className="send-button" 
          disabled={!message.trim()}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;