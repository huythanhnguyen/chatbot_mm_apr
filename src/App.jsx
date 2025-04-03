// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import Chat, { Bubble, useMessages } from '@chatui/core';
import ReactMarkdown from 'react-markdown';
import BackendService from './services/backend-service';
import GeminiService from './services/gemini-service';
import AuthService from './services/auth-service';
import WishlistService from './services/wishlist-service';
import ChatHistoryService from './services/chat-history-service';
import {
  formatProductResults,
  formatProductDetails,
  formatAddToCartResponse,
  formatCartResponse,
  formatCheckoutResponse
} from './utils/formatters';

// Components
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import CartView from './components/CartView';
import ChatInput from './components/ChatInput';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';

// Styles
import '@chatui/core/dist/index.css';
import './styles.css';

// Component để hiển thị tin nhắn có hỗ trợ Markdown
const MarkdownBubble = ({ content }) => {
  return (
    <Bubble>
      <div className="markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Bubble>
  );
};

// Component hiển thị danh sách sản phẩm trong chat
const ProductListBubble = ({ products, onViewDetails, onAddToCart }) => {
  return (
    <Bubble>
      <ProductList 
        products={products} 
        onViewDetails={onViewDetails} 
        onAddToCart={onAddToCart} 
      />
    </Bubble>
  );
};

// Component hiển thị chi tiết sản phẩm trong chat
const ProductDetailBubble = ({ product, onAddToCart, onBack }) => {
  return (
    <Bubble>
      <ProductDetail 
        product={product} 
        onAddToCart={onAddToCart} 
        onBack={onBack} 
      />
    </Bubble>
  );
};

// Component hiển thị giỏ hàng trong chat
const CartViewBubble = ({ cartData, onClose, onCheckout }) => {
  return (
    <Bubble>
      <CartView 
        cartData={cartData} 
        onClose={onClose} 
        onCheckout={onCheckout} 
      />
    </Bubble>
  );
};

function App() {
  const { messages, appendMsg, setTyping } = useMessages([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [cartData, setCartData] = useState(null);
  const [showingProductDetail, setShowingProductDetail] = useState(false);
  const [showingCart, setShowingCart] = useState(false);
  
  // State cho sidebar và auth
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
  // State cho chat history
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  // Kiểm tra đăng nhập và tải dữ liệu ban đầu
  useEffect(() => {
    // Kiểm tra đăng nhập
    const checkAuth = () => {
      const isLoggedIn = AuthService.isAuthenticated();
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn) {
        const user = AuthService.getCurrentUser();
        setUserInfo(user);
      }
    };
    
    // Tải danh sách yêu thích
    const loadWishlist = () => {
      const wishlist = WishlistService.getAll();
      setWishlistItems(wishlist);
    };
    
    // Tải lịch sử chat
    const loadChatHistory = () => {
      const history = ChatHistoryService.getAllChats();
      setChatHistory(history);
      
      const currentId = ChatHistoryService.getCurrentChatId();
      if (currentId) {
        setCurrentChatId(currentId);
        const messages = ChatHistoryService.getChatById(currentId)?.messages || [];
        
        // Khôi phục lịch sử trò chuyện
        if (messages.length > 0) {
          const userMessages = [];
          
          messages.forEach((msg) => {
            appendMsg({
              type: 'text',
              content: { text: msg.content },
              position: msg.role === 'user' ? 'right' : 'left',
            });
            
            // Cập nhật lịch sử trò chuyện trong state
            userMessages.push({ role: msg.role, content: msg.content });
          });
          
          setConversationHistory(userMessages);
        }
      } else if (history.length > 0) {
        setCurrentChatId(history[0].id);
        ChatHistoryService.setCurrentChat(history[0].id);
      } else {
        // Tạo chat mới nếu không có lịch sử
        handleNewChat();
      }
    };
    
    checkAuth();
    loadWishlist();
    loadChatHistory();
    initCart();
    
    // Test API connection
    testApiConnection();
  }, []);
  
  // Cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Cập nhật danh sách yêu thích khi có thay đổi
  useEffect(() => {
    const updateWishlist = () => {
      const wishlist = WishlistService.getAll();
      setWishlistItems(wishlist);
    };
    
    // Thêm event listener cho localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'mm_wishlist_items') {
        updateWishlist();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Kiểm tra kết nối API
  const testApiConnection = async () => {
    try {
      const testResult = await GeminiService.testConnection();
      console.log('Kết quả kiểm tra API:', testResult);
      
      if (!testResult.success) {
        appendMsg({
          type: 'text',
          content: {
            text: `⚠️ Cảnh báo: Kết nối API Gemini có vấn đề. Lỗi: ${testResult.error}`
          },
        });
      }
    } catch (error) {
      console.error('Lỗi kiểm tra API:', error);
    }
  };

  // Khởi tạo giỏ hàng
  const initCart = async () => {
    try {
      console.log('Khởi tạo giỏ hàng...');
      const storedCartId = localStorage.getItem('cartId');
      
      if (storedCartId) {
        setCartId(storedCartId);
        // Tải thông tin giỏ hàng từ server
        await loadCart(storedCartId);
      } else {
        const response = await BackendService.createCart();
        console.log('Phản hồi khởi tạo giỏ hàng:', response);
        
        if (response.cart_id) {
          setCartId(response.cart_id);
          localStorage.setItem('cartId', response.cart_id);
          console.log('Đã tạo giỏ hàng mới:', response.cart_id);
        } else {
          console.error('Không tìm thấy cart_id trong phản hồi');
        }
      }
    } catch (error) {
      console.error('Lỗi khởi tạo giỏ hàng:', error);
    }
  };
  
  // Tải thông tin giỏ hàng
  const loadCart = async (cartId) => {
    try {
      const cartResponse = await BackendService.getCart(cartId);
      setCartData(cartResponse);
      
      if (cartResponse?.data?.cart?.items) {
        setCartItems(cartResponse.data.cart.items);
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
    }
  };

  // Xử lý đăng nhập thành công
  const handleLoginSuccess = (token) => {
    setIsAuthenticated(true);
    const user = AuthService.getCurrentUser();
    setUserInfo(user);
    
    // Đồng bộ wishlist và giỏ hàng
    WishlistService.syncWithAccount(token);
    
    // Cập nhật danh sách yêu thích
    setWishlistItems(WishlistService.getAll());
    
    // Đóng modal
    setShowAuthModal(false);
  };
  
  // Xử lý đăng xuất
  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserInfo(null);
  };
  
  // Tạo chat mới
  const handleNewChat = () => {
    // Tạo chat mới với ChatHistoryService
    const newChatId = ChatHistoryService.createNewChat();
    setCurrentChatId(newChatId);
    
    // Reset state
    setConversationHistory([]);
    
    // Xóa tin nhắn cũ và hiển thị tin nhắn chào mừng mới
    while (messages.length > 0) {
      messages.pop();
    }
    
    appendMsg({
      type: 'text',
      content: {
        text: 'Xin chào! Tôi là trợ lý MM Mega Market. Tôi có thể giúp bạn tìm kiếm sản phẩm, xem chi tiết và thêm vào giỏ hàng. Bạn cần hỗ trợ gì ạ?'
      },
    });
  };
  
  // Chọn chat từ lịch sử
  const handleSelectChat = (chatId) => {
    if (chatId === currentChatId) return;
    
    ChatHistoryService.setCurrentChat(chatId);
    setCurrentChatId(chatId);
    
    // Lấy tin nhắn từ chat đã chọn
    const chat = ChatHistoryService.getChatById(chatId);
    if (chat && chat.messages) {
      // Xóa tin nhắn cũ
      while (messages.length > 0) {
        messages.pop();
      }
      
      // Hiển thị lại tin nhắn từ lịch sử
      const userMessages = [];
      
      chat.messages.forEach((msg) => {
        appendMsg({
          type: 'text',
          content: { text: msg.content },
          position: msg.role === 'user' ? 'right' : 'left',
        });
        
        // Cập nhật lịch sử trò chuyện trong state
        userMessages.push({ role: msg.role, content: msg.content });
      });
      
      setConversationHistory(userMessages);
    }
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (message) => {
    if (!message.trim()) {
      return;
    }

    // Kiểm tra các lệnh đặc biệt
    if (message === "/debug") {
      setDebugMode(!debugMode);
      appendMsg({
        type: 'text',
        content: { text: `Đã ${!debugMode ? 'bật' : 'tắt'} chế độ debug` },
      });
      return;
    }

    // Reset trạng thái hiển thị sản phẩm và giỏ hàng
    setShowingProductDetail(false);
    setShowingCart(false);

    // Hiển thị tin nhắn của người dùng
    appendMsg({
      type: 'text',
      content: { text: message },
      position: 'right',
    });

    // Lưu tin nhắn vào lịch sử chat
    ChatHistoryService.addMessage('user', message);
    
    // Cập nhật lịch sử trò chuyện cho Gemini
    const updatedHistory = [...conversationHistory, { role: 'user', content: message }];
    setConversationHistory(updatedHistory);

    // Cập nhật lịch sử chat trong state
    setChatHistory(ChatHistoryService.getAllChats());

    // Hiển thị trạng thái đang nhập
    setTyping(true);
    setIsTyping(true);

    // Thử xử lý phản hồi chung trước nếu các API khác bị lỗi
    let fallbackResponse = '';
    try {
      fallbackResponse = await GeminiService.generateResponse([{ role: 'user', content: message }], 
        'Bạn là trợ lý ảo của MM Vietnam Shop. Hãy trả lời thân thiện, ngắn gọn và bằng tiếng Việt.');
    } catch (fallbackError) {
      console.error("Lỗi khi tạo phản hồi dự phòng:", fallbackError);
    }

    try {
      // Phân tích ý định người dùng bằng Gemini
      const intent = await GeminiService.determineUserIntent(message);
      console.log('Ý định người dùng:', intent);

      // Xử lý theo ý định
      switch (intent.intent) {
        case 'search_product':
          try {
            const searchResults = await BackendService.searchProducts(intent.keyword || message);
            
            if (searchResults.data?.products?.items?.length > 0) {
              setSearchResults(searchResults.data.products.items);
              
              // Hiển thị kết quả sản phẩm dạng danh sách có thể click
              appendMsg({
                type: 'custom',
                content: {
                  type: 'productList',
                  products: searchResults.data.products.items,
                },
              });
              
              // Thêm tin nhắn văn bản
              const responseText = `Tôi đã tìm thấy ${searchResults.data.products.items.length} sản phẩm cho "${intent.keyword || message}". Bạn có thể nhấp vào sản phẩm để xem chi tiết.`;
              appendMsg({
                type: 'text',
                content: { text: responseText },
              });
              
              // Lưu phản hồi vào lịch sử chat
              ChatHistoryService.addMessage('assistant', responseText);
              setConversationHistory([...updatedHistory, { role: 'assistant', content: responseText }]);
            } else {
              // Không tìm thấy sản phẩm
              const noResultsMsg = `Tôi không tìm thấy sản phẩm nào phù hợp với "${intent.keyword || message}". Bạn có thể thử tìm kiếm với từ khóa khác.`;
              appendMsg({
                type: 'text',
                content: { text: noResultsMsg },
              });
              
              // Lưu phản hồi vào lịch sử chat
              ChatHistoryService.addMessage('assistant', noResultsMsg);
              setConversationHistory([...updatedHistory, { role: 'assistant', content: noResultsMsg }]);
            }
          } catch (error) {
            console.error('Lỗi khi tìm kiếm sản phẩm:', error);
            const errorMsg = debugMode 
              ? `Lỗi tìm kiếm sản phẩm: ${error.message}` 
              : "Xin lỗi, tôi không thể tìm kiếm sản phẩm lúc này.";
              
            appendMsg({
              type: 'text',
              content: { text: errorMsg },
            });
            
            // Lưu phản hồi vào lịch sử chat
            ChatHistoryService.addMessage('assistant', errorMsg);
            setConversationHistory([...updatedHistory, { role: 'assistant', content: errorMsg }]);
          }
          break;

        case 'product_details':
          try {
            const productDetails = await BackendService.getProductDetails(intent.sku);
            
            if (productDetails.data?.products?.items?.length > 0) {
              const product = productDetails.data.products.items[0];
              setSelectedProduct(product);
              setShowingProductDetail(true);
              
              // Hiển thị chi tiết sản phẩm dạng có thể tương tác
              appendMsg({
                type: 'custom',
                content: {
                  type: 'productDetail',
                  product: product,
                },
              });
              
              // Lưu phản hồi vào lịch sử chat
              const responseText = `Chi tiết sản phẩm: ${product.name}`;
              ChatHistoryService.addMessage('assistant', responseText);
              setConversationHistory([...updatedHistory, { role: 'assistant', content: responseText }]);
            } else {
              const noProductMsg = `Tôi không tìm thấy thông tin cho sản phẩm với mã SKU: ${intent.sku}.`;
              appendMsg({
                type: 'text',
                content: { text: noProductMsg },
              });
              
              // Lưu phản hồi vào lịch sử chat
              ChatHistoryService.addMessage('assistant', noProductMsg);
              setConversationHistory([...updatedHistory, { role: 'assistant', content: noProductMsg }]);
            }
          } catch (error) {
            console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
            const errorMsg = debugMode 
              ? `Lỗi lấy chi tiết sản phẩm: ${error.message}` 
              : "Xin lỗi, tôi không thể lấy thông tin sản phẩm lúc này.";
              
            appendMsg({
              type: 'text',
              content: { text: errorMsg },
            });
            
            // Lưu phản hồi vào lịch sử chat
            ChatHistoryService.addMessage('assistant', errorMsg);
            setConversationHistory([...updatedHistory, { role: 'assistant', content: errorMsg }]);
          }
          break;

        case 'add_to_cart':
          if (!intent.sku) {
            const skuRequiredMsg = 'Vui lòng cung cấp mã SKU của sản phẩm bạn muốn thêm vào giỏ hàng.';
            appendMsg({
              type: 'text', 
              content: { text: skuRequiredMsg }
            });
            
            // Lưu phản hồi vào lịch sử chat
            ChatHistoryService.addMessage('assistant', skuRequiredMsg);
            setConversationHistory([...updatedHistory, { role: 'assistant', content: skuRequiredMsg }]);
            break;
          }

          // Kiểm tra giỏ hàng
          if (!cartId) {
            await initCart();
          }

          try {
            const quantity = intent.quantity || 1;
            const addToCartResponse = await BackendService.addToCart(cartId, intent.sku, quantity);
            const formattedResponse = formatAddToCartResponse(addToCartResponse);
            
            // Hiển thị thông báo thêm vào giỏ hàng thành công
            appendMsg({
              type: 'text',
              content: { text: formattedResponse },
            });
            
            // Lưu phản hồi vào lịch sử chat
            ChatHistoryService.addMessage('assistant', formattedResponse);
            setConversationHistory([...updatedHistory, { role: 'assistant', content: formattedResponse }]);
            
            // Cập nhật lại giỏ hàng
            await loadCart(cartId);
            
            // Tự động hiển thị giỏ hàng sau khi thêm sản phẩm
            handleViewCart();
          } catch (error) {
            console.error('Lỗi khi thêm vào giỏ hàng:', error);
            const errorMsg = debugMode 
              ? `Lỗi thêm vào giỏ hàng: ${error.message}` 
              : "Xin lỗi, tôi không thể thêm sản phẩm vào giỏ hàng lúc này.";
              
            appendMsg({
              type: 'text',
              content: { text: errorMsg },
            });
            
            // Lưu phản hồi vào lịch sử chat
            ChatHistoryService.addMessage('assistant', errorMsg);
            setConversationHistory([...updatedHistory, { role: 'assistant', content: errorMsg }]);
          }
          break;

        case 'view_cart':
          handleViewCart();
          break;

        case 'checkout':
          handleCheckout();
          break;

        default:
          // Sử dụng phản hồi đã chuẩn bị từ trước
          const defaultResponse = fallbackResponse || 'Xin lỗi, tôi không hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn được không?';
          appendMsg({
            type: 'text',
            content: { text: defaultResponse },
          });
          
          // Lưu phản hồi vào lịch sử chat
          ChatHistoryService.addMessage('assistant', defaultResponse);
          setConversationHistory([...updatedHistory, { role: 'assistant', content: defaultResponse }]);
          break;
      }
    } catch (error) {
      console.error('Lỗi xử lý tin nhắn:', error);
      
      // Hiển thị thông báo lỗi với debug info nếu được bật
      let errorMessage = 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.';
      
      if (debugMode) {
        errorMessage += ` Lỗi: ${error.message || 'Không xác định'}`;
      }
      
      // Dùng phản hồi dự phòng nếu có
      if (fallbackResponse) {
        errorMessage = fallbackResponse;
      }
      
      appendMsg({
        type: 'text',
        content: { text: errorMessage },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', errorMessage);
      setConversationHistory([...updatedHistory, { role: 'assistant', content: errorMessage }]);
    } finally {
      // Tắt trạng thái đang nhập
      setTyping(false);
      setIsTyping(false);
    }
  };

  // Xử lý tải lên file
  const handleFileUpload = (file) => {
    if (!file) return;
    
    // Hiển thị thông báo về file đã tải lên
    appendMsg({
      type: 'text',
      content: { text: `Đã tải lên file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` },
      position: 'right',
    });
    
    // Lưu tin nhắn vào lịch sử chat
    ChatHistoryService.addMessage('user', `Đã tải lên file: ${file.name}`);
    
    // Để đơn giản, chỉ hiển thị thông báo đã nhận file
    appendMsg({
      type: 'text',
      content: { text: `Tôi đã nhận được file ${file.name}. Bạn muốn tôi phân tích nội dung của file này không?` },
    });
    
    // Lưu phản hồi vào lịch sử chat
    ChatHistoryService.addMessage('assistant', `Tôi đã nhận được file ${file.name}. Bạn muốn tôi phân tích nội dung của file này không?`);
  };

  // Xử lý xem chi tiết sản phẩm
  const handleViewProductDetails = async (sku) => {
    setTyping(true);
    setIsTyping(true);
    
    try {
      const productDetails = await BackendService.getProductDetails(sku);
      
      if (productDetails.data?.products?.items?.length > 0) {
        const product = productDetails.data.products.items[0];
        setSelectedProduct(product);
        setShowingProductDetail(true);
        
        // Hiển thị chi tiết sản phẩm dạng có thể tương tác
        appendMsg({
          type: 'custom',
          content: {
            type: 'productDetail',
            product: product,
          },
        });
        
        // Lưu thao tác này vào lịch sử chat
        const responseText = `Chi tiết sản phẩm: ${product.name}`;
        ChatHistoryService.addMessage('assistant', responseText);
      } else {
        const noProductMsg = `Tôi không tìm thấy thông tin cho sản phẩm với mã SKU: ${sku}.`;
        appendMsg({
          type: 'text',
          content: { text: noProductMsg },
        });
        
        // Lưu phản hồi vào lịch sử chat
        ChatHistoryService.addMessage('assistant', noProductMsg);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
      const errorMsg = debugMode 
        ? `Lỗi lấy chi tiết sản phẩm: ${error.message}` 
        : "Xin lỗi, tôi không thể lấy thông tin sản phẩm lúc này.";
        
      appendMsg({
        type: 'text',
        content: { text: errorMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', errorMsg);
    } finally {
      setTyping(false);
      setIsTyping(false);
    }
  };

  // Xử lý thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async (sku, quantity) => {
    setTyping(true);
    setIsTyping(true);
    
    // Kiểm tra giỏ hàng
    if (!cartId) {
      await initCart();
    }
    
    try {
      const addToCartResponse = await BackendService.addToCart(cartId, sku, quantity);
      const formattedResponse = formatAddToCartResponse(addToCartResponse);
      
      appendMsg({
        type: 'text',
        content: { text: formattedResponse },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', formattedResponse);
      
      // Cập nhật lại giỏ hàng
      await loadCart(cartId);
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      const errorMsg = debugMode 
        ? `Lỗi thêm vào giỏ hàng: ${error.message}` 
        : "Xin lỗi, tôi không thể thêm sản phẩm vào giỏ hàng lúc này.";
        
      appendMsg({
        type: 'text',
        content: { text: errorMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', errorMsg);
    } finally {
      setTyping(false);
      setIsTyping(false);
    }
  };

  // Xử lý xem giỏ hàng
  const handleViewCart = async () => {
    setTyping(true);
    setIsTyping(true);
    
    if (!cartId) {
      const emptyCartMsg = 'Giỏ hàng của bạn hiện đang trống.';
      appendMsg({
        type: 'text',
        content: { text: emptyCartMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', emptyCartMsg);
      
      setTyping(false);
      setIsTyping(false);
      return;
    }

    try {
      const cartData = await BackendService.getCart(cartId);
      setCartData(cartData);
      
      if (!cartData.data?.cart?.items || cartData.data.cart.items.length === 0) {
        const emptyCartMsg = 'Giỏ hàng của bạn hiện đang trống.';
        appendMsg({
          type: 'text',
          content: { text: emptyCartMsg },
        });
        
        // Lưu phản hồi vào lịch sử chat
        ChatHistoryService.addMessage('assistant', emptyCartMsg);
      } else {
        setCartItems(cartData.data.cart.items);
        setShowingCart(true);
        
        // Hiển thị giỏ hàng dạng có thể tương tác
        appendMsg({
          type: 'custom',
          content: {
            type: 'cartView',
            cartData: cartData,
          },
        });
        
        // Lưu phản hồi vào lịch sử chat
        ChatHistoryService.addMessage('assistant', 'Đây là giỏ hàng của bạn.');
      }
    } catch (error) {
      console.error('Lỗi khi xem giỏ hàng:', error);
      const errorMsg = debugMode 
        ? `Lỗi xem giỏ hàng: ${error.message}` 
        : "Xin lỗi, tôi không thể hiển thị giỏ hàng lúc này.";
        
      appendMsg({
        type: 'text',
        content: { text: errorMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', errorMsg);
    } finally {
      setTyping(false);
      setIsTyping(false);
    }
  };

  // Xử lý thanh toán
  const handleCheckout = async () => {
    setTyping(true);
    setIsTyping(true);
    
    if (!cartId) {
      const emptyCartMsg = 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.';
      appendMsg({
        type: 'text',
        content: { text: emptyCartMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', emptyCartMsg);
      
      setTyping(false);
      setIsTyping(false);
      return;
    }

    try {
      const cartInfo = await BackendService.getCart(cartId);
      
      if (!cartInfo.data?.cart?.items || cartInfo.data.cart.items.length === 0) {
        const emptyCartMsg = 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.';
        appendMsg({
          type: 'text',
          content: { text: emptyCartMsg },
        });
        
        // Lưu phản hồi vào lịch sử chat
        ChatHistoryService.addMessage('assistant', emptyCartMsg);
      } else {
        const checkoutResponse = await BackendService.startCheckout(cartId);
        const formattedResponse = formatCheckoutResponse(checkoutResponse);
        
        appendMsg({
          type: 'text',
          content: { text: formattedResponse },
        });
        
        // Lưu phản hồi vào lịch sử chat
        ChatHistoryService.addMessage('assistant', formattedResponse);
      }
    } catch (error) {
      console.error('Lỗi khi thanh toán:', error);
      const errorMsg = debugMode 
        ? `Lỗi thanh toán: ${error.message}` 
        : "Xin lỗi, tôi không thể xử lý thanh toán lúc này.";
        
      appendMsg({
        type: 'text',
        content: { text: errorMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      ChatHistoryService.addMessage('assistant', errorMsg);
    } finally {
      setTyping(false);
      setIsTyping(false);
    }
  };

  // Quay lại danh sách sản phẩm từ chi tiết sản phẩm
  const handleBackToProductList = () => {
    setShowingProductDetail(false);
    
    if (searchResults && searchResults.length > 0) {
      // Hiển thị lại danh sách sản phẩm
      appendMsg({
        type: 'custom',
        content: {
          type: 'productList',
          products: searchResults,
        },
      });
    }
  };

  // Đóng giỏ hàng
  const handleCloseCart = () => {
    setShowingCart(false);
  };
  
  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const handleUpdateCartQuantity = async (itemId, quantity) => {
    if (!cartId) return;
    
    try {
      // Giả định BackendService có phương thức updateCartItem
      await BackendService.updateCartItem(cartId, itemId, quantity);
      
      // Cập nhật lại giỏ hàng
      await loadCart(cartId);
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng sản phẩm:', error);
    }
  };
  
  // Xóa sản phẩm khỏi giỏ hàng
  const handleRemoveFromCart = async (itemId) => {
    if (!cartId) return;
    
    try {
      // Giả định BackendService có phương thức removeFromCart
      await BackendService.removeFromCart(cartId, itemId);
      
      // Cập nhật lại giỏ hàng
      await loadCart(cartId);
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    }
  };
  
  // Toggle trạng thái yêu thích
  const handleToggleWishlist = (product) => {
    WishlistService.toggle(product);
    setWishlistItems(WishlistService.getAll());
  };

  // Tùy chỉnh cách hiển thị nội dung tin nhắn
  const renderMessageContent = (msg) => {
    // Kiểm tra msg và msg.content một cách kỹ lưỡng
    if (!msg) {
      return <Bubble content="Tin nhắn không tồn tại" />;
    }
  
    const { type, content } = msg;
  
    // Kiểm tra type và content
    if (!type) {
      return <Bubble content="Loại tin nhắn không xác định" />;
    }
  
    if (!content) {
      return (
        <div className="loading-container">
          <div className="spinner">
            <div className="bounce1"></div>
            <div className="bounce2"></div>
            <div className="bounce3"></div>
          </div>
        </div>
      );
    }
  
    // Xử lý các loại tin nhắn
    switch (type) {
      case 'text':
        // Kiểm tra nội dung văn bản
        if (!content.text) {
          return <Bubble content="Tin nhắn văn bản trống" />;
        }
        
        // Kiểm tra nếu nội dung có chứa Markdown
        if (content.text && (
          content.text.includes('**') || 
          content.text.includes('##') || 
          content.text.includes('```')
        )) {
          return <MarkdownBubble content={content.text} />;
        }
        
        return <Bubble content={content.text} />;
  
      case 'custom':
        // Xử lý tin nhắn tùy chỉnh
        switch (content.type) {
          case 'productList':
            return (
              <ProductListBubble 
                products={content.products || []} 
                onViewDetails={handleViewProductDetails}
                onAddToCart={handleAddToCart}
              />
            );
          
          case 'productDetail':
            return (
              <ProductDetailBubble 
                product={content.product || {}}
                onAddToCart={handleAddToCart}
                onBack={handleBackToProductList}
              />
            );
          
          case 'cartView':
            return (
              <CartViewBubble 
                cartData={content.cartData || {}}
                onClose={handleCloseCart}
                onCheckout={handleCheckout}
              />
            );
            
          default:
            return <Bubble content="Loại tin nhắn tùy chỉnh không xác định" />;
        }
  
      default:
        return <Bubble content="Loại tin nhắn không được hỗ trợ" />;
    }
  };

  // Quick replies - các phản hồi nhanh
  const defaultQuickReplies = [
    {
      name: '🔍 Tìm kiếm sản phẩm',
      isNew: true,
      isHighlight: true,
    },
    {
      name: '🛒 Xem giỏ hàng',
      isNew: false,
    },
    {
      name: '💳 Thanh toán',
      isNew: false,
    },
    {
      name: '❓ Hỗ trợ',
      isNew: false,
    },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        chatHistory={chatHistory}
        onChatSelect={handleSelectChat}
        onNewChat={handleNewChat}
        wishlistItems={wishlistItems}
        cartItems={cartItems}
        onViewCart={handleViewCart}
        onViewWishlist={() => console.log('View wishlist')}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />
      
      {/* Thanh tiêu đề */}
      <div className="app-header">
        <div className="header-left">
          <button 
            className="menu-button" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu chính"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="logo-container">
            <img 
              src="/mega-market-logo.png" 
              alt="MM Logo" 
              className="logo"
              onError={(e) => {e.target.src = 'https://via.placeholder.com/120x40?text=MM+Logo'}}
            />
          </div>
          <h1 className="app-title">MM Mega Market</h1>
        </div>
        
        <div className="header-right">
          <button 
            className="header-button wishlist-button"
            onClick={() => console.log('View wishlist')}
            aria-label="Xem danh sách yêu thích"
          >
            <i className="far fa-heart"></i>
            {wishlistItems.length > 0 && <span className="badge">{wishlistItems.length}</span>}
          </button>
          
          <button 
            className="header-button cart-button"
            onClick={handleViewCart}
            aria-label="Xem giỏ hàng"
          >
            <i className="fas fa-shopping-cart"></i>
            {cartItems.length > 0 && <span className="badge">{cartItems.length}</span>}
          </button>
          
          {isAuthenticated ? (
            <div className="user-profile-mini" onClick={() => setSidebarOpen(true)}>
              <div className="user-avatar-mini">
                {userInfo && userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 
                 userInfo && userInfo.email ? userInfo.email.charAt(0).toUpperCase() : 
                 <i className="fas fa-user"></i>}
              </div>
              <span className="username-mini">{userInfo ? (userInfo.name || userInfo.email) : 'Người dùng'}</span>
            </div>
          ) : (
            <button 
              className="login-button-mini"
              onClick={() => setShowAuthModal(true)}
              aria-label="Đăng nhập"
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Chat UI */}
      <div className="chat-content">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`chat-message ${msg.position === 'right' ? 'user-message' : 'bot-message'}`}
            >
              {renderMessageContent(msg)}
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="typing-indicator active">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          
          {/* Reference for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick replies */}
        <div className="quick-replies">
          {defaultQuickReplies.map((item, index) => (
            <button 
              key={index}
              className={`quick-reply-btn ${item.isHighlight ? 'highlight' : ''}`}
              onClick={() => handleSendMessage(item.name)}
              aria-label={`Gửi nhanh: ${item.name}`}
            >
              {item.name}
            </button>
          ))}
        </div>
        
        {/* Chat input */}
        <ChatInput 
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          isTyping={isTyping}
        />
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;