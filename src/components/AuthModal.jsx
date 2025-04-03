// src/components/AuthModal.jsx
import React, { useState } from 'react';
import './AuthModal.css';
import authService from '../services/auth-service';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu modal không mở, không hiển thị
  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess(result.token);
        }
        onClose();
      } else {
        setError(result.error || 'Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !name) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      // Giả định rằng authService có phương thức register
      // Nếu không, bạn có thể cần triển khai nó
      const result = await authService.register(name, email, password);
      
      if (result.success) {
        // Tự động đăng nhập sau khi đăng ký
        const loginResult = await authService.login(email, password);
        if (loginResult.success) {
          if (onLoginSuccess) {
            onLoginSuccess(loginResult.token);
          }
          onClose();
        } else {
          setError('Đăng ký thành công. Vui lòng đăng nhập.');
          setActiveTab('login');
        }
      } else {
        setError(result.error || 'Đăng ký không thành công. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    // Đóng modal và tiếp tục dưới dạng khách
    onClose();
  };
  
  return (
    <div className="auth-modal-overlay" onClick={(e) => {
      // Đóng modal khi click bên ngoài
      if (e.target.classList.contains('auth-modal-overlay')) {
        onClose();
      }
    }}>
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>MM Vietnam Shop</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="auth-modal-tabs">
          <button 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(''); }}
          >
            Đăng nhập
          </button>
          <button 
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signup'); setError(''); }}
          >
            Đăng ký
          </button>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
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
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Đăng nhập'}
            </button>
            
            <div className="auth-options">
              <a href="#" className="forgot-password">Quên mật khẩu?</a>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <label htmlFor="name">Họ và tên</label>
              <div className="input-with-icon">
                <i className="fas fa-user"></i>
                <input 
                  type="text" 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  id="signup-email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-password">Mật khẩu</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="signup-password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="confirm-password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Đăng ký'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Hoặc tiếp tục với</p>
          <div className="social-login">
            <button className="social-btn facebook">
              <i className="fab fa-facebook-f"></i>
            </button>
            <button className="social-btn google">
              <i className="fab fa-google"></i>
            </button>
          </div>
          
          <div className="guest-login">
            <button 
              type="button" 
              className="guest-btn"
              onClick={handleGuestContinue}
            >
              Tiếp tục không cần đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;