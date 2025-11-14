export const interviewQuestions = [
  "Hãy giới thiệu về bản thân bạn?",
  "Tại sao bạn muốn làm việc tại công ty này?",
  "Điểm mạnh và điểm yếu của bạn là gì?",
  "Kể về một dự án thành công mà bạn đã thực hiện?",
  "Bạn xử lý xung đột trong team như thế nào?"
];

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