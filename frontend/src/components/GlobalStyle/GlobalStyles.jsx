// (MỚI) Thêm CSS vào <style>
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Animation cho thanh recording */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(1.1);
      }
    }
    
    .recording-bar div {
      animation: pulse 0.8s infinite;
    }
    
    .recording-bar div:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .recording-bar div:nth-child(3) {
      animation-delay: 0.4s;
    }

    /* (SỬA) Bong bóng chat - Phong cách LobeHub */
    .chat-bubble-user {
      /* LobeHub User Light */
      background-color: #f1f3f5;
      color: #212529;
    }

    .chat-bubble-user-dark {
      /* LobeHub User Dark */
      background-color: #2b2b2b;
      color: #dee2e6;
    }

    .chat-bubble-ai-light {
      /* LobeHub AI Light */
      background-color: rgba(22, 119, 255, 0.08);
      color: #212529;
    }

    .chat-bubble-ai-dark {
      /* LobeHub AI Dark */
      background-color: rgba(22, 119, 255, 0.15);
      color: #dee2e6;
    }
  `}</style>
);

export default GlobalStyles;