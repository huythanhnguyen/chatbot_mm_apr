import React, { useState, useEffect } from 'react';
import Chat, { Bubble, useMessages } from '@chatui/core';
import ReactMarkdown from 'react-markdown';
import BackendService from './services/backend-service';
import GeminiService from './services/gemini-service';
import {
  formatProductResults,
  formatProductDetails,
  formatAddToCartResponse,
  formatCartResponse,
  formatCheckoutResponse
} from './utils/formatters';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import CartView from './components/CartView';
import ChatLayout from './components/ChatLayout';
import ChatInput from './components/ChatInput';
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
  const [debugMode, setDebugMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [cartData, setCartData] = useState(null);
  const [showingProductDetail, setShowingProductDetail] = useState(false);
  const [showingCart, setShowingCart] = useState(false);
  
  // Các state mới cho sidebar và layout
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Kiểm tra kết nối API khi ứng dụng khởi động
  useEffect(() => {
    async function testApiConnection() {
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
    }
    
    testApiConnection();
  }, []);

  // Khởi tạo giỏ hàng khi component được tạo
  useEffect(() => {
    const storedCartId = localStorage.getItem('cartId');
    if (storedCartId) {
      setCartId(storedCartId);
    } else {
      initCart();
    }

    // Thêm tin nhắn chào mừng
    appendMsg({
      type: 'text',
      content: {
        text: 'Xin chào! Tôi là trợ lý ảo MM Shop. Tôi có thể giúp bạn tìm kiếm sản phẩm, xem chi tiết và thêm vào giỏ hàng. Bạn cần hỗ trợ gì ạ?'
      },
    });
    
    // Tạo chat ID mới nếu chưa có
    if (!currentChatId) {
      createNewChat();
    }
    
    // Load lịch sử chat từ localStorage
    loadChatHistory();
  }, []);

  // Khởi tạo giỏ hàng
  const initCart = async () => {
    try {
      console.log('Khởi tạo giỏ hàng...');
      const response = await BackendService.createCart();
      console.log('Phản hồi khởi tạo giỏ hàng:', response);
      
      if (response.cart_id) {
        setCartId(response.cart_id);
        localStorage.setItem('cartId', response.cart_id);
        console.log('Đã tạo giỏ hàng mới:', response.cart_id);
      } else {
        console.error('Không tìm thấy cart_id trong phản hồi');
      }
    } catch (error) {
      console.error('Lỗi khởi tạo giỏ hàng:', error);
    }
  };
  
  // Tạo chat mới
  const createNewChat = () => {
    const newChatId = `chat_${Date.now()}`;
    
    const newChat = {
      id: newChatId,
      title: "Cuộc trò chuyện mới",
      messages: [],
      timestamp: Date.now()
    };
    
    setChatHistory(prevHistory => {
      const updatedHistory = [newChat, ...prevHistory];
      // Lưu lịch sử chat vào localStorage
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
    
    // Reset các state hiện tại
    setCurrentChatId(newChatId);
    setConversationHistory([]);
    setMessages([]);
    
    // Thêm tin nhắn chào mừng cho chat mới
    appendMsg({
      type: 'text',
      content: {
        text: 'Xin chào! Tôi là trợ lý ảo MM Shop. Tôi có thể giúp bạn tìm kiếm sản phẩm, xem chi tiết và thêm vào giỏ hàng. Bạn cần hỗ trợ gì ạ?'
      },
    });
  };

  // Load lịch sử chat từ localStorage
  const loadChatHistory = () => {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setChatHistory(history);
        
        // Nếu có lịch sử, chọn chat gần nhất
        if (history.length > 0 && !currentChatId) {
          setCurrentChatId(history[0].id);
          
          // Load tin nhắn từ chat đã chọn
          if (history[0].messages && history[0].messages.length > 0) {
            setConversationHistory(history[0].messages);
            
            // Hiển thị lại tin nhắn (optional, tùy theo cách quản lý tin nhắn)
            // Đây là phần phức tạp vì cần phải xây dựng lại toàn bộ luồng chat
            // có thể thực hiện hoặc bỏ qua tùy theo yêu cầu
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử chat:', error);
    }
  };

  // Chọn một chat từ lịch sử
  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
    
    // Load messages của chat đã chọn
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat && selectedChat.messages) {
      setConversationHistory(selectedChat.messages);
      
      // Reset tin nhắn hiện tại và hiển thị lại từ lịch sử
      // Đây là phần phức tạp, có thể cần điều chỉnh tùy theo cách quản lý messages của @chatui/core
    }
  };

  // Xử lý đăng nhập
  const handleLogin = () => {
    // Đây là phần giả định, cần thay thế bằng logic đăng nhập thực tế
    setIsLoggedIn(true);
    setUserInfo({
      name: "Khách hàng",
      email: "customer@example.com"
    });
    
    // Có thể thêm logic load wishlist tại đây
  };

  // Hàm này thay thế cho handleSend trong App.jsx gốc
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
    
    if (message === "/test-api") {
      appendMsg({
        type: 'text',
        content: { text: "Đang kiểm tra kết nối API Gemini..." },
      });
      
      try {
        const testResult = await GeminiService.testConnection();
        appendMsg({
          type: 'text',
          content: { 
            text: testResult.success 
              ? "✅ API Gemini hoạt động bình thường!" 
              : `❌ Lỗi kết nối API Gemini: ${testResult.error}` 
          },
        });
      } catch (error) {
        appendMsg({
          type: 'text',
          content: { text: `❌ Lỗi kiểm tra API: ${error.message}` },
        });
      }
      return;
    }
    
    if (message === "/test-backend") {
      appendMsg({
        type: 'text',
        content: { text: "Đang kiểm tra kết nối backend..." },
      });
      
      try {
        const response = await BackendService.searchProducts("test");
        appendMsg({
          type: 'text',
          content: { 
            text: response ? "✅ Backend hoạt động bình thường!" : "❌ Backend không trả về dữ liệu"
          },
        });
      } catch (error) {
        appendMsg({
          type: 'text',
          content: { text: `❌ Lỗi kết nối backend: ${error.message}` },
        });
      }
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

    // Cập nhật lịch sử hội thoại
    const updatedHistory = [...conversationHistory, { role: 'user', content: message }];
    setConversationHistory(updatedHistory);
    
    // Lưu tin nhắn vào lịch sử chat
    saveChatMessage(message, 'user');

    // Hiển thị trạng thái đang nhập
    setTyping(true);

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
              appendMsg({
                type: 'text',
                content: { 
                  text: `Tôi đã tìm thấy ${searchResults.data.products.items.length} sản phẩm cho "${intent.keyword || message}". Bạn có thể nhấp vào sản phẩm để xem chi tiết.`
                },
              });
              
              // Lưu phản hồi vào lịch sử chat
              saveChatMessage(`Tôi đã tìm thấy ${searchResults.data.products.items.length} sản phẩm cho "${intent.keyword || message}". Bạn có thể nhấp vào sản phẩm để xem chi tiết.`, 'assistant');
            } else {
              // Không tìm thấy sản phẩm
              const noResultsMsg = `Tôi không tìm thấy sản phẩm nào phù hợp với "${intent.keyword || message}". Bạn có thể thử tìm kiếm với từ khóa khác.`;
              appendMsg({
                type: 'text',
                content: { text: noResultsMsg },
              });
              
              // Lưu phản hồi vào lịch sử chat
              saveChatMessage(noResultsMsg, 'assistant');
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
            saveChatMessage(errorMsg, 'assistant');
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
              saveChatMessage(`Chi tiết sản phẩm: ${product.name}`, 'assistant');
            } else {
              const noProductMsg = `Tôi không tìm thấy thông tin cho sản phẩm với mã SKU: ${intent.sku}.`;
              appendMsg({
                type: 'text',
                content: { text: noProductMsg },
              });
              
              // Lưu phản hồi vào lịch sử chat
              saveChatMessage(noProductMsg, 'assistant');
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
            saveChatMessage(errorMsg, 'assistant');
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
            saveChatMessage(skuRequiredMsg, 'assistant');
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
            saveChatMessage(formattedResponse, 'assistant');
            
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
            saveChatMessage(errorMsg, 'assistant');
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
          saveChatMessage(defaultResponse, 'assistant');
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
      saveChatMessage(errorMessage, 'assistant');
    } finally {
      // Tắt trạng thái đang nhập
      setTyping(false);
    }
  };

  // Lưu tin nhắn vào lịch sử chat
  const saveChatMessage = (message, role) => {
    if (!currentChatId) return;
    
    setChatHistory(prevHistory => {
      const updatedHistory = prevHistory.map(chat => {
        if (chat.id === currentChatId) {
          // Cập nhật tiêu đề chat dựa trên tin nhắn đầu tiên của người dùng
          let updatedTitle = chat.title;
          if (role === 'user' && (!chat.messages || chat.messages.length === 0)) {
            updatedTitle = message.length > 30 ? message.substring(0, 30) + '...' : message;
          }
          
          return {
            ...chat,
            title: updatedTitle,
            messages: [...(chat.messages || []), { role, content: message }],
            timestamp: Date.now()
          };
        }
        return chat;
      });
      
      // Lưu vào localStorage
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  // Hàm xử lý tải lên file
  const handleFileUpload = (files) => {
    // Hiển thị thông báo về file đã tải lên
    appendMsg({
      type: 'text',
      content: { text: `Đã tải lên ${files.length} file.` },
      position: 'right',
    });
    
    // Lưu tin nhắn vào lịch sử chat
    saveChatMessage(`Đã tải lên ${files.length} file.`, 'user');
    
    // Logic xử lý file
    console.log('Files uploaded:', files);
    
    // Để đơn giản, chỉ hiển thị thông báo đã nhận file
    appendMsg({
      type: 'text',
      content: { text: `Tôi đã nhận được ${files.length} file. Bạn muốn tôi phân tích nội dung của các file này không?` },
    });
    
    // Lưu phản hồi vào lịch sử chat
    saveChatMessage(`Tôi đã nhận được ${files.length} file. Bạn muốn tôi phân tích nội dung của các file này không?`, 'assistant');
  };

  // Hàm xử lý xem chi tiết sản phẩm
  const handleViewProductDetails = async (sku) => {
    setTyping(true);
    
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
        saveChatMessage(`Chi tiết sản phẩm: ${product.name}`, 'assistant');
      } else {
        const noProductMsg = `Tôi không tìm thấy thông tin cho sản phẩm với mã SKU: ${sku}.`;
        appendMsg({
          type: 'text',
          content: { text: noProductMsg },
        });
        
        // Lưu phản hồi vào lịch sử chat
        saveChatMessage(noProductMsg, 'assistant');
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
      saveChatMessage(errorMsg, 'assistant');
    } finally {
      setTyping(false);
    }
  };

  // Hàm xử lý thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async (sku, quantity) => {
    setTyping(true);
    
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
      saveChatMessage(formattedResponse, 'assistant');
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
      saveChatMessage(errorMsg, 'assistant');
    } finally {
      setTyping(false);
    }
  };

  // Hàm xử lý xem giỏ hàng
  const handleViewCart = async () => {
    setTyping(true);
    
    if (!cartId) {
      const emptyCartMsg = 'Giỏ hàng của bạn hiện đang trống.';
      appendMsg({
        type: 'text',
        content: { text: emptyCartMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      saveChatMessage(emptyCartMsg, 'assistant');
      
      setTyping(false);
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
        saveChatMessage(emptyCartMsg, 'assistant');
      } else {
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
        saveChatMessage('Đây là giỏ hàng của bạn.', 'assistant');
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
      saveChatMessage(errorMsg, 'assistant');
    } finally {
      setTyping(false);
    }
  };

  // Hàm xử lý thanh toán
  const handleCheckout = async () => {
    setTyping(true);
    
    if (!cartId) {
      const emptyCartMsg = 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.';
      appendMsg({
        type: 'text',
        content: { text: emptyCartMsg },
      });
      
      // Lưu phản hồi vào lịch sử chat
      saveChatMessage(emptyCartMsg, 'assistant');
      
      setTyping(false);
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
        saveChatMessage(emptyCartMsg, 'assistant');
      } else {
        const checkoutResponse = await BackendService.startCheckout(cartId);
        const formattedResponse = formatCheckoutResponse(checkoutResponse);
        
        appendMsg({
          type: 'text',
          content: { text: formattedResponse },
        });
        
        // Lưu phản hồi vào lịch sử chat
        saveChatMessage(formattedResponse, 'assistant');
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
      saveChatMessage(errorMsg, 'assistant');
    } finally {
      setTyping(false);
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

  // Tùy chỉnh cách hiển thị nội dung tin nhắn
  const renderMessageContent = (msg) => {
    const { content, type } = msg;
    
    // Xử lý các loại tin nhắn tùy chỉnh
    if (type === 'custom') {
      switch (content.type) {
        case 'productList':
          return (
            <ProductListBubble 
              products={content.products} 
              onViewDetails={handleViewProductDetails}
              onAddToCart={handleAddToCart}
            />
          );
        
        case 'productDetail':
          return (
            <ProductDetailBubble 
              product={content.product}
              onAddToCart={handleAddToCart}
              onBack={handleBackToProductList}
            />
          );
        
        case 'cartView':
          return (
            <CartViewBubble 
              cartData={content.cartData}
              onClose={handleCloseCart}
              onCheckout={handleCheckout}
            />
          );
          
        default:
          return <Bubble content={content.text} />;
      }
    }
    
    // Kiểm tra nếu nội dung có chứa Markdown
    if (content.text && (
      content.text.includes('**') || 
      content.text.includes('##') || 
      content.text.includes('```')
    )) {
      return <MarkdownBubble content={content.text} />;
    }
    
    // Nếu không, hiển thị bong bóng chat thông thường
    return <Bubble content={content.text} />;
  };

  // Reset tin nhắn để load chat mới
  const setMessages = (newMessages) => {
    // Không có phương thức trực tiếp để reset messages trong useMessages
    // Nhưng có thể hiển thị lại nội dung từ đầu sau khi chọn chat mới
  };

  return (
    <ChatLayout
      onNewChat={createNewChat}
      chatHistory={chatHistory}
      onSelectChat={selectChat}
      currentChatId={currentChatId}
      onLogin={handleLogin}
      isLoggedIn={isLoggedIn}
      userInfo={userInfo}
      wishlistItems={wishlistItems}
    >
      <div className="chat-content">
        <div className="chat-header">
          <h2>{debugMode ? 'MM Vietnam Shop (Debug Mode)' : 'MM Vietnam Shop'}</h2>
        </div>
        
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
          {typing && (
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
        </div>
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
        />
      </div>
    </ChatLayout>
  );
}

export default App;