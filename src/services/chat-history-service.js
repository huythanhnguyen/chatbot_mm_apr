// Hằng số cho localStorage
const CHAT_HISTORY_STORAGE_KEY = 'mm_chat_history';
const CURRENT_CHAT_ID_KEY = 'mm_current_chat_id';
const MAX_HISTORY_LENGTH = 50; // Giới hạn số lượng tin nhắn trong một cuộc trò chuyện
const MAX_HISTORY_SIZE = 20; // Giới hạn số lượng cuộc trò chuyện

class ChatHistoryService {
  constructor() {
    this._chatHistory = [];
    this._currentChatId = null;
    this._loadFromLocalStorage();
  }

  // Phương thức private để tải lịch sử chat từ localStorage
  _loadFromLocalStorage() {
    try {
      // Tải lịch sử chat
      const savedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        this._chatHistory = JSON.parse(savedHistory);
      }

      // Tải ID chat hiện tại
      const currentChatId = localStorage.getItem(CURRENT_CHAT_ID_KEY);
      if (currentChatId) {
        this._currentChatId = currentChatId;
      }
    } catch (error) {
      console.error('Error loading chat history from localStorage:', error);
      this._chatHistory = [];
      this._currentChatId = null;
    }
  }

  // Phương thức private để lưu lịch sử chat vào localStorage
  _saveToLocalStorage() {
    try {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(this._chatHistory));
      
      if (this._currentChatId) {
        localStorage.setItem(CURRENT_CHAT_ID_KEY, this._currentChatId);
      } else {
        localStorage.removeItem(CURRENT_CHAT_ID_KEY);
      }
    } catch (error) {
      console.error('Error saving chat history to localStorage:', error);
    }
  }

  // Tạo một cuộc trò chuyện mới
  createNewChat(title = '') {
    const timestamp = new Date().toISOString();
    const chatId = `chat_${Date.now()}`;
    
    const newChat = {
      id: chatId,
      title: title || `Trò chuyện ${this._chatHistory.length + 1}`,
      timestamp,
      messages: []
    };
    
    // Thêm vào đầu danh sách
    this._chatHistory.unshift(newChat);
    
    // Giới hạn số lượng cuộc trò chuyện
    if (this._chatHistory.length > MAX_HISTORY_SIZE) {
      this._chatHistory = this._chatHistory.slice(0, MAX_HISTORY_SIZE);
    }
    
    // Đặt cuộc trò chuyện này làm cuộc trò chuyện hiện tại
    this._currentChatId = chatId;
    
    // Lưu vào localStorage
    this._saveToLocalStorage();
    
    return chatId;
  }

  // Lấy tất cả cuộc trò chuyện
  getAllChats() {
    return this._chatHistory.map(chat => ({
      id: chat.id,
      title: chat.title,
      timestamp: chat.timestamp,
      messageCount: chat.messages.length
    }));
  }

  // Lấy ID của cuộc trò chuyện hiện tại
  getCurrentChatId() {
    return this._currentChatId;
  }

  // Thiết lập cuộc trò chuyện hiện tại
  setCurrentChat(chatId) {
    // Kiểm tra xem chatId có tồn tại trong lịch sử không
    const chatExists = this._chatHistory.some(chat => chat.id === chatId);
    
    if (chatExists) {
      this._currentChatId = chatId;
      this._saveToLocalStorage();
      return true;
    }
    
    return false;
  }

  // Lấy cuộc trò chuyện theo ID
  getChatById(chatId) {
    return this._chatHistory.find(chat => chat.id === chatId) || null;
  }

  // Lấy tin nhắn của cuộc trò chuyện hiện tại
  getCurrentChatMessages() {
    if (!this._currentChatId) return [];
    
    const currentChat = this.getChatById(this._currentChatId);
    return currentChat ? currentChat.messages : [];
  }

  // Thêm tin nhắn vào cuộc trò chuyện hiện tại
  addMessage(role, content) {
    // Nếu chưa có cuộc trò chuyện hiện tại, tạo một cuộc mới
    if (!this._currentChatId) {
      this.createNewChat();
    }
    
    const timestamp = new Date().toISOString();
    const message = { role, content, timestamp };
    
    // Tìm cuộc trò chuyện hiện tại
    const currentChatIndex = this._chatHistory.findIndex(chat => chat.id === this._currentChatId);
    
    if (currentChatIndex !== -1) {
      // Thêm tin nhắn mới
      this._chatHistory[currentChatIndex].messages.push(message);
      
      // Giới hạn số lượng tin nhắn
      if (this._chatHistory[currentChatIndex].messages.length > MAX_HISTORY_LENGTH) {
        this._chatHistory[currentChatIndex].messages = this._chatHistory[currentChatIndex].messages.slice(-MAX_HISTORY_LENGTH);
      }
      
      // Cập nhật tiêu đề nếu đây là tin nhắn đầu tiên từ người dùng và cuộc trò chuyện chưa có tiêu đề cụ thể
      if (role === 'user' && 
          this._chatHistory[currentChatIndex].messages.length === 1 &&
          this._chatHistory[currentChatIndex].title.startsWith('Trò chuyện ')) {
        // Sử dụng 10 ký tự đầu tiên của tin nhắn làm tiêu đề
        let newTitle = content.substring(0, 30).trim();
        if (content.length > 30) newTitle += '...';
        this._chatHistory[currentChatIndex].title = newTitle;
      }
      
      // Cập nhật timestamp của cuộc trò chuyện
      this._chatHistory[currentChatIndex].timestamp = timestamp;
      
      // Đưa cuộc trò chuyện lên đầu danh sách nếu nó không đã ở đầu
      if (currentChatIndex !== 0) {
        const currentChat = this._chatHistory.splice(currentChatIndex, 1)[0];
        this._chatHistory.unshift(currentChat);
      }
      
      // Lưu vào localStorage
      this._saveToLocalStorage();
      
      return true;
    }
    
    return false;
  }

  // Xóa một cuộc trò chuyện theo ID
  deleteChat(chatId) {
    const initialLength = this._chatHistory.length;
    this._chatHistory = this._chatHistory.filter(chat => chat.id !== chatId);
    
    if (this._chatHistory.length !== initialLength) {
      // Nếu đã xóa cuộc trò chuyện hiện tại
      if (this._currentChatId === chatId) {
        // Đặt cuộc trò chuyện mới nhất làm cuộc trò chuyện hiện tại nếu còn cuộc trò chuyện nào đó
        this._currentChatId = this._chatHistory.length > 0 ? this._chatHistory[0].id : null;
      }
      
      // Lưu vào localStorage
      this._saveToLocalStorage();
      return true;
    }
    
    return false;
  }

  // Xóa tất cả cuộc trò chuyện
  clearAllChats() {
    this._chatHistory = [];
    this._currentChatId = null;
    this._saveToLocalStorage();
  }

  // Đổi tên cuộc trò chuyện
  renameChat(chatId, newTitle) {
    const chat = this.getChatById(chatId);
    
    if (chat) {
      chat.title = newTitle;
      this._saveToLocalStorage();
      return true;
    }
    
    return false;
  }

  // Đồng bộ lịch sử chat với tài khoản đã đăng nhập (API)
  async syncWithAccount(userId) {
    // Phương thức này sẽ được triển khai khi có API
    // Đồng bộ lịch sử chat giữa các thiết bị
    console.log('Syncing chat history for user:', userId);
    return true;
  }
}

export default new ChatHistoryService();