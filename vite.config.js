import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Tải biến môi trường dựa trên mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    preview: {
      // Cho phép tất cả các hosts, bao gồm cả domain Render
      host: '0.0.0.0',
      port: process.env.PORT || 3000,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'chatbot-mm-apr.onrender.com',
        '.onrender.com' // Cho phép tất cả subdomain của onrender.com
      ]
    },
    define: {
      // Khắc phục lỗi process.env không tìm thấy trong Vite
      'process.env': {}
    }
  };
});
