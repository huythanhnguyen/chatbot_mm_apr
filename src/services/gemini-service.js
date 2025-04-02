import { GoogleGenerativeAI } from "@google/generative-ai";

// Lấy API key từ biến môi trường của Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Sử dụng mô hình mới hơn (gemini-2.0-flash thay vì gemini-pro)
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

class GeminiService {
  // Phân tích ý định người dùng
  async determineUserIntent(message) {
    try {
      console.log('Phân tích ý định từ:', message);
      
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Phân tích ý định người dùng từ tin nhắn sau: "${message}". 
            Trả về dưới dạng JSON với các trường: 
            - intent (search_product, product_details, add_to_cart, view_cart, checkout, general_question)
            - keyword (nếu là search_product)
            - sku (nếu là product_details hoặc add_to_cart)
            - quantity (nếu là add_to_cart, mặc định là 1)`
          }]
        }],
        generationConfig: {
          ...generationConfig,
          temperature: 0.1  // Giảm temperature để kết quả nhất quán hơn
        }
      });

      const intentText = result.response.text();
      console.log('Phân tích ý định kết quả:', intentText);
      
      // Trích xuất JSON từ text
      const jsonMatch = intentText.match(/\{[^]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Lỗi parse JSON:', e);
          return { intent: 'general_question' };
        }
      }
      
      return { intent: 'general_question' };
    } catch (error) {
      console.error('Lỗi khi phân tích ý định:', error);
      return { intent: 'general_question' };
    }
  }

  // Tạo phản hồi chung
  async generateResponse(messages, systemPrompt = null) {
    try {
      // Chuẩn bị lịch sử trò chuyện
      const history = [];
      
      // Thêm system prompt nếu có
      if (systemPrompt) {
        history.push({
          role: "user", 
          parts: [{ text: `[System instruction: ${systemPrompt}]` }]
        });
        history.push({
          role: "model",
          parts: [{ text: "Tôi hiểu." }]
        });
      }
      
      // Thêm tin nhắn người dùng và bot
      for (let i = 0; i < messages.length - 1; i++) {
        history.push({
          role: messages[i].role === 'user' ? 'user' : 'model',
          parts: [{ text: messages[i].content }]
        });
      }
      
      // Khởi tạo phiên chat với lịch sử
      const chatSession = model.startChat({
        generationConfig,
        history,
      });
      
      // Gửi tin nhắn cuối cùng
      const lastMessage = messages[messages.length - 1];
      const result = await chatSession.sendMessage(lastMessage.content);
      
      return result.response.text();
    } catch (error) {
      console.error('Lỗi khi tạo phản hồi:', error);
      return 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.';
    }
  }
  
  // Kiểm tra kết nối
  async testConnection() {
    try {
      const result = await model.generateContent("Xin chào");
      return { 
        success: true, 
        data: result.response.text() 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data 
      };
    }
  }
}

export default new GeminiService();
