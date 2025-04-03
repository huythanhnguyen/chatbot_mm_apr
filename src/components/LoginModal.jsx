import React, { useState } from 'react';
import './LoginModal.css';
import authService from '../services/auth-service';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Thêm state cho modal login
const [showLoginModal, setShowLoginModal] = useState(false);
// Trong LoginModal.jsx, thử thêm tạm thời dòng này:
try {
  console.log("Auth service:", authService);
} catch (e) {
  console.error("Error with auth service:", e);
}
// Hàm xử lý đăng nhập thành công
const handleLoginSuccess = (token) => {
  setIsLoggedIn(true);
  // Gọi API lấy thông tin user
  fetch('/user-info', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setUserInfo(data));
};

// Render thêm LoginModal
{showLoginModal && (
  <LoginModal 
    isOpen={showLoginModal}
    onClose={() => setShowLoginModal(false)}
    onLoginSuccess={handleLoginSuccess}
  />
)}
  // Nếu modal không mở, không hiển thị
  if (!isOpen) return null;
  
 // Trong hàm handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.data?.generateCustomerToken?.token) {
      localStorage.setItem('authToken', result.data.generateCustomerToken.token);
      onLoginSuccess(result.data.generateCustomerToken.token);
      onClose();
    } else {
      setError(result.error || 'Đăng nhập thất bại');
    }
  } catch (error) {
    setError('Lỗi kết nối server');
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