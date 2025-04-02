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
  // Khởi tạo giỏ hàng
  const initCart = async () => {
    try {
      const response = await BackendService.createCart();
      if (response.cart_id) {
        setCartId(response.cart_id);
        localStorage.setItem('cartId', response.cart_id);
        console.log('Đã tạo giỏ hàng mới:', response.cart_id);
      }
    } catch (error) {
      console.error('Lỗi khởi tạo giỏ hàng:', error);
    }
  };

  // Xử lý khi gửi tin nhắn
  const handleSend = async (type, val) => {
    if (type === 'text' && val.trim()) {
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

      try {
        // Phân tích ý định người dùng bằng Gemini
        const intent = await GeminiService.determineUserIntent(val);
        console.log('Ý định người dùng:', intent);

        let responseText = '';

        // Xử lý theo ý định
        switch (intent.intent) {
          case 'search_product':
            const searchResults = await BackendService.searchProducts(intent.keyword || val);
            responseText = formatProductResults(searchResults);
            break;

          case 'product_details':
            const productDetails = await BackendService.getProductDetails(intent.sku);
            responseText = formatProductDetails(productDetails);
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

            const quantity = intent.quantity || 1;
            const addToCartResponse = await BackendService.addToCart(cartId, intent.sku, quantity);
            responseText = formatAddToCartResponse(addToCartResponse);
            break;

          case 'view_cart':
            if (!cartId) {
              responseText = 'Giỏ hàng của bạn hiện đang trống.';
              break;
            }

            const cartData = await BackendService.getCart(cartId);
            responseText = formatCartResponse(cartData);
            break;

          case 'checkout':
            if (!cartId) {
              responseText = 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.';
              break;
            }

            const cartInfo = await BackendService.getCart(cartId);
            if (!cartInfo.data || !cartInfo.data.cart || !cartInfo.data.cart.items || cartInfo.data.cart.items.length === 0) {
              responseText = 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.';
              break;
            }

            const checkoutResponse = await BackendService.startCheckout(cartId);
            responseText = formatCheckoutResponse(checkoutResponse);
            break;

          default:
            // Sử dụng Gemini cho các câu hỏi chung
            responseText = await GeminiService.generateResponse(updatedHistory, 
              'Bạn là trợ lý ảo của MM Vietnam Shop. Hãy trả lời thân thiện, ngắn gọn và bằng tiếng Việt. Không được đề cập đến việc bạn là AI.');
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
        
        // Hiển thị thông báo lỗi
        appendMsg({
          type: 'text',
          content: { text: 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.' },
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
  ];

  return (
    <div className="chatbot-container">
      <Chat
        navbar={{
          title: 'MM Vietnam Shop',
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
        messagesRef={el => {
          if (el) {
            // Tự động cuộn xuống cuối khi có tin nhắn mới
            setTimeout(() => {
              el.scrollTop = el.scrollHeight;
            }, 0);
          }
        }}
      />
    </div>
  );
}

export default App;