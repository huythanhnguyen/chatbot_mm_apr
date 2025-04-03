import React, { useState } from 'react';
import './LoginModal.css';
import authService from '../services/auth-service';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu modal không mở, không hiển thị
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sử dụng authService trực tiếp thay vì gọi fetch
      const result = await authService.login(email, password);
      
      if (result.success) {
        // Gọi callback onLoginSuccess nếu đăng nhập thành công
        onLoginSuccess(result.token);
        onClose();
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      setError('Lỗi kết nối server');
      console.error('Login error:', error);
    }
    setLoading(false);
  };

  const handleGuestContinue = () => {
    // Đóng modal và tiếp tục dưới dạng khách
    onClose();
  };
  
  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <div className="login-modal-header">
          <h2>Đăng nhập</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="login-tabs">
          <button className="login-tab active">Đăng nhập</button>
          <button className="login-tab">Tiếp tục không đăng nhập</button>
        </div>
        
        <div className="login-content">
          {error && <div className="login-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
          
          <div className="guest-option">
            <p>Hoặc</p>
            <button className="guest-button" onClick={handleGuestContinue}>
              Tiếp tục không đăng nhập
            </button>
            <p className="guest-note">
              Một số tính năng sẽ bị hạn chế khi bạn không đăng nhập
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;