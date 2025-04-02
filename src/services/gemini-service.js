import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class GeminiService {
  // Phân tích ý định người dùng
  async determineUserIntent(message) {
    try {
      console.log('Gửi yêu cầu đến Gemini để phân tích ý định:', message);
      console.log('API Key có tồn tại:', !!GEMINI_API_KEY);
      
      if (!GEMINI_API_KEY) {
        console.error('API Key không được cấu hình');
        return { intent: 'general_question' };
      }
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            role: 'user',
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
            temperature: 0.1,
          },
        }
      );
      
      console.log('Phản hồi từ Gemini:', response.data);
      
      if (!response.data.candidates || response.data.candidates.length === 0) {
        console.error('Không có phản hồi từ Gemini');
        return { intent: 'general_question' };
      }
      
      const intentText = response.data.candidates[0].content.parts[0].text;
      console.log('Intent text:', intentText);
      
      // Trích xuất JSON từ text
      const jsonMatch = intentText.match(/\{[^]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          console.log('Phân tích ý định thành công:', result);
          return result;
        } catch (e) {
          console.error('Lỗi parse JSON:', e);
          return { intent: 'general_question' };
        }
      }
      
      return { intent: 'general_question' };
    } catch (error) {
      console.error('Lỗi khi phân tích ý định:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      return { intent: 'general_question' };
    }
  }

  // Tạo phản hồi chung 
  async generateResponse(messages, systemPrompt = null) {
    try {
      console.log('Gửi yêu cầu phản hồi chung đến Gemini với messages:', messages);
      
      if (!GEMINI_API_KEY) {
        console.error('API Key không được cấu hình');
        return 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn do thiếu cấu hình API.';
      }
      
      // Tạo tin nhắn mẫu đơn giản khi không có nội dung
      if (!messages || messages.length === 0) {
        messages = [{ role: 'user', content: 'Xin chào' }];
      }
      
      // Chuyển đổi tin nhắn sang định dạng Gemini
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Thêm prompt hệ thống nếu có
      if (systemPrompt) {
        formattedMessages.unshift({
          role: 'user',
          parts: [{ text: `[System instruction: ${systemPrompt}]` }]
        });
      }
      
      console.log('Formatted messages:', formattedMessages);
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: formattedMessages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }
      );
      
      console.log('Phản hồi API:', response.data);
      
      if (!response.data.candidates || response.data.candidates.length === 0) {
        console.error('Không có phản hồi từ Gemini');
        return 'Xin lỗi, API không trả về phản hồi hợp lệ.';
      }
      
      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Lỗi khi tạo phản hồi:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        return 'Xin lỗi, yêu cầu không hợp lệ. Vui lòng thử lại với câu hỏi khác.';
      }
      
      if (error.response?.status === 403) {
        return 'Xin lỗi, có vấn đề với xác thực API. Vui lòng kiểm tra cấu hình.';
      }
      
      return 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Lỗi: ' + (error.message || 'Không xác định');
    }
  }
  
  // Phương thức đơn giản để kiểm tra API key
  async testConnection() {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            role: 'user',
            parts: [{ text: 'Xin chào' }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          },
        }
      );
      return { success: true, data: response.data };
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