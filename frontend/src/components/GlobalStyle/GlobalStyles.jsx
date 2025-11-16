// // (MỚI) Thêm CSS vào <style>
// const GlobalStyles = () => (
//   <style jsx global>{`
//     @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

//     /* Animation cho thanh recording */
//     @keyframes pulse {
//       0%, 100% {
//         opacity: 1;
//         transform: scale(1);
//       }
//       50% {
//         opacity: 0.7;
//         transform: scale(1.1);
//       }
//     }
    
//     .recording-bar div {
//       animation: pulse 0.8s infinite;
//     }
    
//     .recording-bar div:nth-child(2) {
//       animation-delay: 0.2s;
//     }
    
//     .recording-bar div:nth-child(3) {
//       animation-delay: 0.4s;
//     }

//     /* (SỬA) Bong bóng chat - Phong cách LobeHub */
//     .chat-bubble-user {
//       /* LobeHub User Light */
//       background-color: #f1f3f5;
//       color: #212529;
//     }

//     .chat-bubble-user-dark {
//       /* LobeHub User Dark */
//       background-color: #2b2b2b;
//       color: #dee2e6;
//     }

//     .chat-bubble-ai-light {
//       /* LobeHub AI Light */
//       background-color: rgba(22, 119, 255, 0.08);
//       color: #212529;
//     }

//     .chat-bubble-ai-dark {
//       /* LobeHub AI Dark */
//       background-color: rgba(22, 119, 255, 0.15);
//       color: #dee2e6;
//     }
//   `}</style>
// );

// export default GlobalStyles;

import React from 'react';

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

    /* Bong bóng chat - Phong cách LobeHub */
    .chat-bubble-user {
      background-color: #f1f3f5;
      color: #212529;
    }
    .chat-bubble-user-dark {
      background-color: #2b2b2b;
      color: #dee2e6;
    }
    .chat-bubble-ai-light {
      background-color: rgba(22, 119, 255, 0.08);
      color: #212529;
    }
    .chat-bubble-ai-dark {
      background-color: rgba(22, 119, 255, 0.15);
      color: #dee2e6;
    }

    /* === (MỚI) CSS CHO THANH CUỘN === */
    
    /* Áp dụng cho các khu vực cuộn cụ thể */
    .chat-window-scroll,
    .sider-menu-area {
      /* --- Firefox --- */
      scrollbar-width: thin;
      
      /* (SỬA) Ẩn thanh cuộn trên Firefox cho giao diện tối */
      scrollbar-color: #444 #141414; /* Thumb Track (Dark) */
    }
    
    .chatbot-content[data-theme='light'] .chat-window-scroll,
    .app-sider[data-theme='light'] .sider-menu-area {
       /* --- Firefox (Light) --- */
      scrollbar-color: #ccc #f8f9fa; /* Thumb Track (Light) */
    }


    /* --- WebKit (Chrome, Safari, Edge) --- */
    .chat-window-scroll::-webkit-scrollbar,
    .sider-menu-area::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    /* WebKit - Light Theme */
    .chatbot-content[data-theme='light'] .chat-window-scroll::-webkit-scrollbar-track,
    .app-sider[data-theme='light'] .sider-menu-area::-webkit-scrollbar-track {
      background: #f8f9fa; /* Nền sáng */
    }
    .chatbot-content[data-theme='light'] .chat-window-scroll::-webkit-scrollbar-thumb,
    .app-sider[data-theme='light'] .sider-menu-area::-webkit-scrollbar-thumb {
      background: #ccc; /* Thanh cuộn sáng */
      border-radius: 4px;
    }
    .chatbot-content[data-theme='light'] .chat-window-scroll::-webkit-scrollbar-thumb:hover,
    .app-sider[data-theme='light'] .sider-menu-area::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }

    /* WebKit - Dark Theme */
    .chatbot-content[data-theme='dark'] .chat-window-scroll::-webkit-scrollbar-track,
    .app-sider[data-theme='dark'] .sider-menu-area::-webkit-scrollbar-track {
      background: #141414; /* Nền content tối */
    }
    .chatbot-content[data-theme='dark'] .chat-window-scroll::-webkit-scrollbar-thumb,
    .app-sider[data-theme='dark'] .sider-menu-area::-webkit-scrollbar-thumb {
      background: #444; /* Thanh cuộn tối */
      border-radius: 4px;
    }
    .chatbot-content[data-theme='dark'] .chat-window-scroll::-webkit-scrollbar-thumb:hover,
    .app-sider[data-theme='dark'] .sider-menu-area::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

  `}</style>
);

export default GlobalStyles;