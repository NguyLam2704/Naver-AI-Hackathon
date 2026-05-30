// Cài đặt SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US'; // Changed to English for better accuracy
}

// Hàm lấy thời gian
export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Tin nhắn chào mừng
export const defaultWelcomeMessage = { 
sender: 'ai', 
  // Sửa thành tiếng Anh để đồng bộ với "Language Constraint" của Prompt
  text: "Hello. I am your AI Technical Recruiter. Please paste the Job Description (JD) so we can define the standard bar for this interview.", 
  time: getCurrentTime()
};