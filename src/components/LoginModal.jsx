import React, { useState } from 'react';
import './LoginModal.css';
import authService from '../services/auth-service';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' hoặc 'guest'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu modal không mở, không hiển thị
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Sử dụng authService trực tiếp thay vì gọi fetch
      const result = await authService.login(email, password);
      
      if (result.success) {
        // Lấy thông tin người dùng hiện tại từ authService
        const userInfo = authService.getCurrentUser();
        
        // Gọi callback onLoginSuccess nếu đăng nhập thành công
        if (onLoginSuccess) {
          onLoginSuccess(result.token, userInfo);
        }
        
        // Đóng modal
        onClose();
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      setError('Lỗi kết nối tới máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    // Đóng modal và tiếp tục dưới dạng khách
    onClose();
  };
  
  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(''); // Xóa thông báo lỗi khi chuyển tab
  };
  
  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <div className="login-modal-header">
          <h2>MM Vietnam Shop</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="login-tabs">
          <button 
            className={`login-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Đăng nhập
          </button>
          <button 
            className={`login-tab ${activeTab === 'guest' ? 'active' : ''}`}
            onClick={() => switchTab('guest')}
          >
            Tiếp tục không đăng nhập
          </button>
        </div>
        
        <div className="login-content">
          {error && (
            <div className="login-error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          
          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope"></i>
                  <input 
                    type="email" 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="auth-submit-btn login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
                  </>
                ) : 'Đăng nhập'}
              </button>
              
              <div className="auth-options">
                <a href="#" className="forgot-password">Quên mật khẩu?</a>
              </div>
            </form>
          ) : (
            <div className="guest-section">
              <p>Bạn có thể tiếp tục sử dụng dịch vụ mà không cần đăng nhập.</p>
              <p className="guest-note">
                <i className="fas fa-info-circle"></i> Lưu ý: Một số tính năng sẽ bị hạn chế khi bạn không đăng nhập.
              </p>
              <button className="guest-button" onClick={handleGuestContinue}>
                Tiếp tục với tư cách khách
              </button>
            </div>
          )}
          
          <div className="auth-footer">
            <p>Hoặc đăng nhập với</p>
            <div className="social-login">
              <button className="social-btn facebook" title="Đăng nhập với Facebook">
                <i className="fab fa-facebook-f"></i>
              </button>
              <button className="social-btn google" title="Đăng nhập với Google">
                <i className="fab fa-google"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;