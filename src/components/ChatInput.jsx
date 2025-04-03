// src/components/ChatInput.jsx
import React, { useState, useRef } from 'react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, onFileUpload, isTyping }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    // Gửi tin nhắn khi nhấn Enter (nhưng không phải khi nhấn Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Hiển thị tên file trong phần input
      setMessage(`File: ${file.name}`);
    }
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    setMessage('');
    fileInputRef.current.value = '';
  };

  const handleRecordToggle = () => {
    // Đây chỉ là mô phỏng, cần triển khai API ghi âm thực tế
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Bắt đầu ghi âm
      console.log('Bắt đầu ghi âm...');
      // Thêm code xử lý ghi âm thực tế ở đây
    } else {
      // Dừng ghi âm và xử lý âm thanh
      console.log('Dừng ghi âm và xử lý...');
      // Thêm code xử lý dừng ghi âm và gửi dữ liệu ở đây
    }
  };

  const handleUploadFile = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      handleFileClear();
    }
  };

  return (
    <div className="chat-input-container">
      {isTyping && (
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      )}
      
      {selectedFile && (
        <div className="selected-file">
          <div className="file-info">
            <i className="fas fa-file"></i>
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <div className="file-actions">
            <button type="button" onClick={handleUploadFile} className="upload-file-btn">
              <i className="fas fa-upload"></i>
            </button>
            <button type="button" onClick={handleFileClear} className="remove-file-btn">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      
      <form className="chat-form" onSubmit={handleSubmit}>
        <button 
          type="button" 
          className="attachment-btn" 
          onClick={handleFileButtonClick}
          title="Đính kèm tệp"
          aria-label="Đính kèm tệp"
        >
          <i className="fas fa-plus"></i>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="file-input" 
          accept=".txt,.csv,.xlsx,.xls,.json,.pdf"
        />
        
        <div className="input-wrapper">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn hoặc câu hỏi..."
            rows="1"
            className="chat-textarea"
          />
          {message && (
            <button 
              type="button" 
              className="clear-button" 
              onClick={() => setMessage('')}
              title="Xóa nội dung"
              aria-label="Xóa nội dung"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <button 
          type="button" 
          className={`voice-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecordToggle}
          title={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
          aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
        >
          <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
        </button>
        
        <button 
          type="submit" 
          className="send-button mm-blue"
          disabled={!message.trim() && !selectedFile}
          title="Gửi tin nhắn"
          aria-label="Gửi tin nhắn"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;