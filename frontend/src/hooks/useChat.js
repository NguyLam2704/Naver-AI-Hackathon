import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { interviewQuestions, getCurrentTime, defaultWelcomeMessage } from '../utils/chatHelpers';

// Hàm lấy state ban đầu từ localStorage
const getInitialChatSessions = () => {
  if (typeof window !== 'undefined') {
    const savedChats = localStorage.getItem('chatSessions');
    try {
      return savedChats ? JSON.parse(savedChats) : [];
    } catch (e) {
      console.error("Lỗi parse JSON từ localStorage:", e);
      return [];
    }
  }
  return [];
};

const getInitialActiveChatId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('activeChatId');
  }
  return null;
};

export const useChat = () => {
  const [chatSessions, setChatSessions] = useState(getInitialChatSessions);
  const [activeChatId, setActiveChatId] = useState(getInitialActiveChatId);
  const [renamingChatId, setRenamingChatId] = useState(null);
  const aiResponseTimeoutRef = useRef(null);

  // --- LOGIC MEMOIZED ---
  const activeChat = useMemo(() => 
    chatSessions.find(chat => chat.id === activeChatId),
    [chatSessions, activeChatId]
  );
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  // --- EFFECTS ---
  // Lưu vào localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    } catch (error) {
      console.error("LỖI QUOTA: Không thể lưu chat sessions:", error);
      message.error("Lỗi: Dung lượng lưu trữ đã đầy! Ảnh có thể không được lưu.");
    }
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    }
  }, [chatSessions, activeChatId]); 

  // Khởi tạo (chỉ chạy 1 lần)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (chatSessions.length === 0) {
      const newChatId = crypto.randomUUID();
      setChatSessions([
        { 
          id: newChatId, 
          title: 'New Chat', 
          messages: [defaultWelcomeMessage], 
          currentQuestion: 0 
        }
      ]);
      setActiveChatId(newChatId);
    } else if (!activeChatId || !chatSessions.find(c => c.id === activeChatId)) {
      setActiveChatId(chatSessions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- HANDLERS ---
  const triggerAiResponse = useCallback(() => {
    if (aiResponseTimeoutRef.current) {
      clearTimeout(aiResponseTimeoutRef.current);
    }
    aiResponseTimeoutRef.current = setTimeout(() => {
      let aiResponse = "Câu trả lời hay đấy! ";
      setChatSessions(prevSessions => 
        prevSessions.map(chat => {
          if (chat.id === activeChatId) {
            let nextQuestion = chat.currentQuestion;
            if (nextQuestion < interviewQuestions.length - 1) {
              nextQuestion = nextQuestion + 1;
              aiResponse += interviewQuestions[nextQuestion];
            } else {
              aiResponse += "Cảm ơn bạn đã hoàn thành buổi phỏng vấn. Kết quả của bạn rất tốt! 🎉";
            }
            const aiMessage = { sender: 'ai', text: aiResponse, time: getCurrentTime() };
            return {
              ...chat,
              messages: [...chat.messages, aiMessage],
              currentQuestion: nextQuestion
            };
          }
          return chat;
        })
      );
      aiResponseTimeoutRef.current = null;
    }, 1500);
  }, [activeChatId]); 

  const handleRenameChat = (chatId, newTitle) => {
    if (!newTitle.trim()) {
      setRenamingChatId(null);
      return;
    }
    setChatSessions(prevSessions =>
      prevSessions.map(chat =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
    setRenamingChatId(null);
  };
  
  // (SỬA) handleNewChat không cần dọn dẹp state (component cha sẽ lo)
  const handleNewChat = () => {
    if (aiResponseTimeoutRef.current) clearTimeout(aiResponseTimeoutRef.current);
    
    const newChatId = crypto.randomUUID();
    const newChat = {
      id: newChatId,
      title: `New Chat`,
      messages: [defaultWelcomeMessage],
      currentQuestion: 0
    };
    setChatSessions(prevSessions => [newChat, ...prevSessions]);
    setActiveChatId(newChatId);
    message.success('Đã bắt đầu cuộc trò chuyện mới!');
  };

  const handleDeleteChat = (chatIdToDelete) => {
    const newSessions = chatSessions.filter(chat => chat.id !== chatIdToDelete);
    if (activeChatId === chatIdToDelete) {
      if (newSessions.length > 0) {
        setActiveChatId(newSessions[0].id); 
      } else {
        // Nếu xóa hết, tạo chat mới
        const newChatId = crypto.randomUUID();
        const newChat = {
          id: newChatId,
          title: `New Chat`,
          messages: [defaultWelcomeMessage],
          currentQuestion: 0
        };
        setChatSessions([newChat]);
        setActiveChatId(newChatId);
      }
    } else {
        setChatSessions(newSessions);
    }
    message.success('Đã xóa cuộc trò chuyện!');
  };

  return {
    chatSessions,
    activeChatId,
    activeChat,
    messages,
    renamingChatId,
    setChatSessions, // Cần export để handleSend dùng
    setActiveChatId,
    setRenamingChatId,
    triggerAiResponse,
    handleRenameChat,
    handleNewChat,
    handleDeleteChat
  };
};