import React from 'react';
import './UserProfile.css';

const UserProfile = ({ user, onLogout }) => {
  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="user-info">
        <span className="user-email">{user.email}</span>
      </div>
      <button className="logout-button" onClick={onLogout}>
        <i className="fas fa-sign-out-alt"></i>
      </button>
    </div>
  );
};

export default UserProfile;