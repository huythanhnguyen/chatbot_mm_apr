// src/App.jsx
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

      // Reset trạng thái hiển thị sản phẩm và giỏ hàng
      setShowingProductDetail(false);
      setShowingCart(false);

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

        // Xử lý theo ý định
        switch (intent.intent) {
          case 'search_product':
            try {
              const searchResults = await BackendService.searchProducts(intent.keyword || val);
              
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
                    text: `Tôi đã tìm thấy ${searchResults.data.products.items.length} sản phẩm cho "${intent.keyword || val}". Bạn có thể nhấp vào sản phẩm để xem chi tiết.`
                  },
                });
              } else {
                // Không tìm thấy sản phẩm
                appendMsg({
                  type: 'text',
                  content: { 
                    text: `Tôi không tìm thấy sản phẩm nào phù hợp với "${intent.keyword || val}". Bạn có thể thử tìm kiếm với từ khóa khác.`
                  },
                });
              }
            } catch (error) {
              console.error('Lỗi khi tìm kiếm sản phẩm:', error);
              appendMsg({
                type: 'text',
                content: { 
                  text: debugMode 
                    ? `Lỗi tìm kiếm sản phẩm: ${error.message}` 
                    : "Xin lỗi, tôi không thể tìm kiếm sản phẩm lúc này."
                },
              });
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
              } else {
                appendMsg({
                  type: 'text',
                  content: { 
                    text: `Tôi không tìm thấy thông tin cho sản phẩm với mã SKU: ${intent.sku}.`
                  },
                });
              }
            } catch (error) {
              console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
              appendMsg({
                type: 'text',
                content: { 
                  text: debugMode 
                    ? `Lỗi lấy chi tiết sản phẩm: ${error.message}` 
                    : "Xin lỗi, tôi không thể lấy thông tin sản phẩm lúc này."
                },
              });
            }
            break;

          case 'add_to_cart':
            if (!intent.sku) {
              appendMsg({
                type: 'text', 
                content: { text: 'Vui lòng cung cấp mã SKU của sản phẩm bạn muốn thêm vào giỏ hàng.' }
              });
              break;
            }

            // Kiểm tra giỏ hàng
            if (!cartId) {
              await initCart();
            }

            try {
              const quantity = intent.quantity || 1;
              const addToCartResponse = await BackendService.addToCart(cartId, intent.sku, quantity);
              
              // Hiển thị thông báo thêm vào giỏ hàng thành công
              appendMsg({
                type: 'text',
                content: { text: formatAddToCartResponse(addToCartResponse) },
              });
              
              // Tự động hiển thị giỏ hàng sau khi thêm sản phẩm
              handleViewCart();
            } catch (error) {
              console.error('Lỗi khi thêm vào giỏ hàng:', error);
              appendMsg({
                type: 'text',
                content: { 
                  text: debugMode 
                    ? `Lỗi thêm vào giỏ hàng: ${error.message}` 
                    : "Xin lỗi, tôi không thể thêm sản phẩm vào giỏ hàng lúc này."
                },
              });
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
            appendMsg({
              type: 'text',
              content: { text: fallbackResponse || 'Xin lỗi, tôi không hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn được không?' },
            });
            break;
        }

        // Cập nhật lịch sử hội thoại với phản hồi
        // (Đã xử lý riêng trong mỗi case để có phản hồi chính xác)

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
      } else {
        appendMsg({
          type: 'text',
          content: { 
            text: `Tôi không tìm thấy thông tin cho sản phẩm với mã SKU: ${sku}.`
          },
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
      appendMsg({
        type: 'text',
        content: { 
          text: debugMode 
            ? `Lỗi lấy chi tiết sản phẩm: ${error.message}` 
            : "Xin lỗi, tôi không thể lấy thông tin sản phẩm lúc này."
        },
      });
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
      
      appendMsg({
        type: 'text',
        content: { text: formatAddToCartResponse(addToCartResponse) },
      });
      
      // Không hiển thị giỏ hàng tự động ở đây để tránh gián đoạn trải nghiệm
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      appendMsg({
        type: 'text',
        content: { 
          text: debugMode 
            ? `Lỗi thêm vào giỏ hàng: ${error.message}` 
            : "Xin lỗi, tôi không thể thêm sản phẩm vào giỏ hàng lúc này."
        },
      });
    } finally {
      setTyping(false);
    }
  };

  // Hàm xử lý xem giỏ hàng
  const handleViewCart = async () => {
    setTyping(true);
    
    if (!cartId) {
      appendMsg({
        type: 'text',
        content: { text: 'Giỏ hàng của bạn hiện đang trống.' },
      });
      setTyping(false);
      return;
    }

    try {
      const cartData = await BackendService.getCart(cartId);
      setCartData(cartData);
      
      if (!cartData.data?.cart?.items || cartData.data.cart.items.length === 0) {
        appendMsg({
          type: 'text',
          content: { text: 'Giỏ hàng của bạn hiện đang trống.' },
        });
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
      }
    } catch (error) {
      console.error('Lỗi khi xem giỏ hàng:', error);
      appendMsg({
        type: 'text',
        content: { 
          text: debugMode 
            ? `Lỗi xem giỏ hàng: ${error.message}` 
            : "Xin lỗi, tôi không thể hiển thị giỏ hàng lúc này."
        },
      });
    } finally {
      setTyping(false);
    }
  };

  // Hàm xử lý thanh toán
  const handleCheckout = async () => {
    setTyping(true);
    
    if (!cartId) {
      appendMsg({
        type: 'text',
        content: { text: 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.' },
      });
      setTyping(false);
      return;
    }

    try {
      const cartInfo = await BackendService.getCart(cartId);
      
      if (!cartInfo.data?.cart?.items || cartInfo.data.cart.items.length === 0) {
        appendMsg({
          type: 'text',
          content: { text: 'Giỏ hàng của bạn hiện đang trống, không thể thanh toán.' },
        });
      } else {
        const checkoutResponse = await BackendService.startCheckout(cartId);
        
        appendMsg({
          type: 'text',
          content: { text: formatCheckoutResponse(checkoutResponse) },
        });
      }
    } catch (error) {
      console.error('Lỗi khi thanh toán:', error);
      appendMsg({
        type: 'text',
        content: { 
          text: debugMode 
            ? `Lỗi thanh toán: ${error.message}` 
            : "Xin lỗi, tôi không thể xử lý thanh toán lúc này."
        },
      });
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