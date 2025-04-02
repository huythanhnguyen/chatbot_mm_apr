import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@chatui/core/dist/index.css';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);