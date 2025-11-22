// Cài đặt SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'vi-VN';
}

// Hàm lấy thời gian
export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Tin nhắn chào mừng
export const defaultWelcomeMessage = { 
  sender: 'ai', 
  text: 'Xin chào! Tôi là AI Interview Assistant. Hãy bắt đầu buổi phỏng vấn của bạn.', 
  time: getCurrentTime() 
};