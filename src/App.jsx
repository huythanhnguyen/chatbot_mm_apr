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

function App() {
  const { messages, appendMsg, setTyping } = useMessages([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [debugMode, setDebugMode] = useState(false);

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

  // Xử lý khi gửi tin nhắn
  const handleSend = async (type, val) => {
    if (type === 'text' && val.trim()) {
      // Kiểm tra các lệnh đặc biệt
      if (val === "/debug") {
        setDebugMode(!debugMode);
        appendMsg({
          type: 'text',
          content: { text: `Đã ${!debugMode ? 'bật' : 'tắt'} chế độ debug` },
        });
        return;
      }
      
      if (val === "/test-api") {
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
      
      if (val === "/test-backend") {
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

      // Hiển thị tin nhắn của người dùng
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'right',
      });

      // Cập nhật lịch sử hội thoại
      const updatedHistory = [...conversationHistory, { role: 'user', content: val }];
      setConversationHistory(updatedHistory);

      // Hiển thị trạng thái đang nhập
      setTyping(true);

      // Thử xử lý phản hồi chung trước nếu các API khác bị lỗi
      let fallbackResponse = '';
      try {
        fallbackResponse = await GeminiService.generateResponse([{ role: 'user', content: val }], 
          'Bạn là trợ lý ảo của MM Vietnam Shop. Hãy trả lời thân thiện, ngắn gọn và bằng tiếng Việt.');
      } catch (fallbackError) {
        console.error("Lỗi khi tạo phản hồi dự phòng:", fallbackError);
      }

      try {
        // Phân tích ý định người dùng bằng Gemini
        const intent = await GeminiService.determineUserIntent(val);
        console.log('Ý định người dùng:', intent);

        let responseText = '';

        // Xử lý theo ý định
        switch (intent.intent) {
          case 'search_product':
            try {
              const searchResults = await BackendService.searchProducts(intent.keyword || val);
              responseText = formatProductResults(searchResults);
            } catch (error) {
              console.error('Lỗi khi tìm kiếm sản phẩm:', error);
              responseText = debugMode 
                ? `Lỗi tìm kiếm sản phẩm: ${error.message}` 
                : "Xin lỗi, tôi không thể tìm kiếm sản phẩm lúc này.";
            }
            break;

          case 'product_details':
            try {
              const productDetails = await BackendService.getProductDetails(intent.sku);
              responseText = formatProductDetails(productDetails);
            } catch (error) {
              console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
              responseText = debugMode 
                ? `Lỗi lấy chi tiết sản phẩm: ${error.message}` 
                : "Xin lỗi, tôi không thể lấy thông tin sản phẩm lúc này.";
            }
            break;

          case 'add_to_cart':
            if (!intent.sku) {
              responseText = 'Vui lòng cung cấp mã SKU của sản phẩm bạn muốn thêm vào giỏ hàng.';
              break;
            }

            // Kiểm tra giỏ hàng
            if (!cartId) {
              await initCart();
            }

            try {
              const quantity = intent.quantity || 1;
              const addToCartResponse = await BackendService.addToCart(cartId, intent.sku, quantity);
              responseText = formatAddToCartResponse(addToCartResponse);
            } catch (error) {
              console.error('Lỗi khi thêm vào giỏ hàng:', error);
              responseText = debugMode 
                ? `Lỗi thêm vào giỏ hàng: ${error.message}` 
                : "Xin lỗi, tôi không thể thêm sản phẩm vào giỏ hàng lúc này.";
            }
            break;

          case 'view_cart':
            if (!cartId) {
              responseText = 'Giỏ hàng của bạn hiện đang trống.';
              break;
            }

            try {
              const cartData = await BackendService.getCart(cartId);
              responseText = formatCartResponse(cartData);
            } catch (error) {
              console.error('Lỗi khi xem giỏ hàng:', error);
              responseText = debugMode 
                ? `Lỗi xem giỏ hàng: ${error.message}` 
                : "Xin lỗi, tôi không thể hiển thị giỏ hàng lúc này.";
            }
            break;

          case 'checkout':
            if (!cartId) {
              responseText = 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.';
              break;
            }

            try {
              const cartInfo = await BackendService.getCart(cartId);
              if (!cartInfo.data || !cartInfo.data.cart || !cartInfo.data.cart.items || cartInfo.data.cart.items.length === 0) {
                responseText = 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.';
                break;
              }

              const checkoutResponse = await BackendService.startCheckout(cartId);
              responseText = formatCheckoutResponse(checkoutResponse);
            } catch (error) {
              console.error('Lỗi khi thanh toán:', error);
              responseText = debugMode 
                ? `Lỗi thanh toán: ${error.message}` 
                : "Xin lỗi, tôi không thể xử lý thanh toán lúc này.";
            }
            break;

          default:
            // Sử dụng phản hồi đã chuẩn bị từ trước
            responseText = fallbackResponse || 'Xin lỗi, tôi không hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn được không?';
            break;
        }

        // Cập nhật lịch sử hội thoại
        setConversationHistory([...updatedHistory, { role: 'assistant', content: responseText }]);

        // Hiển thị phản hồi từ bot
        appendMsg({
          type: 'text',
          content: { text: responseText },
        });

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
      } finally {
        // Tắt trạng thái đang nhập
        setTyping(false);
      }
    }
  };

  // Tùy chỉnh cách hiển thị nội dung tin nhắn
  const renderMessageContent = (msg) => {
    const { content } = msg;
    
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
    {
      name: '/test-api',
      isNew: false,
    },
  ];

  return (
    <div className="chatbot-container">
      <Chat
        navbar={{
          title: debugMode ? 'MM Vietnam Shop (Debug Mode)' : 'MM Vietnam Shop',
        }}
        messages={messages}
        renderMessageContent={renderMessageContent}
        quickReplies={defaultQuickReplies}
        onQuickReplyClick={(item) => handleSend('text', item.name)}
        onSend={handleSend}
        locale="vi-VN"
        placeholder="Nhập tin nhắn của bạn..."
        loadMoreText="Tải thêm"
        commentsText="tin nhắn"
      />
    </div>
  );
}

export default App;