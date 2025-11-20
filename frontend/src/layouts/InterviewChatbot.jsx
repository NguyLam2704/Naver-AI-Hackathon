import React, { useState, useRef, useEffect, useCallback } from 'react';

import GlobalStyles from '../components/GlobalStyle/GlobalStyles';
import AppSider from './AppSider/AppSider';
import AppHeader from './AppHeader/AppHeader';
import ChatWindow from './ChatWindow/ChatWindow';
import RecordingIndicator from '../components/RecordingIndicator/RecordingIndicator';
import ChatInput from '../components/ChatInput/ChatInput';


import './InterviewChatbot.css'; 


import { Layout, ConfigProvider, theme, Grid, message } from 'antd';

import { useTheme } from '../hooks/useTheme';
import { useChat } from '../hooks/useChat';
import { useFiles } from '../hooks/useFiles';
import { useSpeech } from '../hooks/useSpeech';

import { getCurrentTime } from '../utils/chatHelpers';

const { Content } = Layout;
const { darkAlgorithm, defaultAlgorithm } = theme;
const { useBreakpoint } = Grid;

const InterviewChatbot = () => {
  const screens = useBreakpoint();
  const messagesEndRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false); // UI State có thể giữ lại

  // --- GỌI CÁC CUSTOM HOOK ---
  
  const { themeMode, toggleTheme } = useTheme();
  
  const {
    chatSessions,
    activeChatId,
    activeChat,
    messages,
    renamingChatId,
    setChatSessions, 
    setActiveChatId,
    setRenamingChatId,
    triggerAiResponse,
    handleRenameChat,
    handleNewChat,
    handleDeleteChat
  } = useChat();
  
  const { 
    stagedFiles, 
    setStagedFiles, 
    handleFileUpload, 
    handleRemoveStagedFile 
  } = useFiles();

  // handleSend là "chất keo" kết dính logic chat và logic file
  const handleSend = useCallback(() => {
    // (FIX) Dừng ghi âm nếu đang chạy
    if (isRecording) {
      setIsRecording(false);
    }
    
    const currentInput = inputRef.current; 
    
    if (!currentInput.trim() && stagedFiles.length === 0) return;

    let newTitle = null; 
    let titleUpdated = false;
    const newMessages = []; 

    // 1. Xử lý text
    if (currentInput.trim()) {
      newMessages.push({ 
        sender: 'user', 
        text: currentInput, 
        time: getCurrentTime(), 
        type: 'text' 
      });
      if (activeChat && activeChat.title === 'New Chat') {
        newTitle = currentInput.length > 30 ? currentInput.substring(0, 30) + '...' : currentInput;
        titleUpdated = true;
      }
    }

    // 2. Xử lý file
    if (stagedFiles.length > 0) {
      stagedFiles.forEach(file => {
        newMessages.push({
          sender: 'user',
          text: file.data, // Gửi data base64
          time: getCurrentTime(),
          type: file.type
        });
        if (activeChat && activeChat.title === 'New Chat' && !newTitle) {
          newTitle = file.name;
          titleUpdated = true;
        }
      });
    }

    // 3. Cập nhật state MỘT LẦN DUY NHẤT
    setChatSessions(prevSessions =>
      prevSessions.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, ...newMessages], 
            title: newTitle ? newTitle : chat.title 
          };
        }
        return chat;
      })
    );

    // 4. Dọn dẹp
    setInput(''); 
    setStagedFiles([]);

    // 5. Kích hoạt AI
    triggerAiResponse();
  // (SỬA) Cập nhật dependencies
  }, [activeChat, activeChatId, setChatSessions, stagedFiles, setStagedFiles, triggerAiResponse]);


  const { 
    input, 
    setInput, 
    isRecording, 
    setIsRecording,
    handleVoiceToggle, 
    silenceTimeoutRef,
    inputRef // (SỬA) Lấy inputRef từ hook
  } = useSpeech(handleSend, stagedFiles);
  
  // (SỬA) handleNewChat cần dọn dẹp input và speech
  const handleNewChatWrapper = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setIsRecording(false);
    setInput('');
    setStagedFiles([]); 
    handleNewChat(); // Gọi hàm gốc từ useChat
  };
  
  const handleVoiceToggleWrapper = () => {
      // (SỬA) handleVoiceToggle giờ trả về true/false
      const success = handleVoiceToggle();
      if (!success) {
           message.error('Trình duyệt không hỗ trợ Speech-to-Text');
      }
  };

  // --- RENDER ---
  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? darkAlgorithm : defaultAlgorithm,
        token: {
          fontFamily: "'Inter', sans-serif",
          colorPrimary: '#1677ff',
        }
      }}
    >
      <GlobalStyles />
      <Layout 
        className="chatbot-layout"
      >
        
        <AppSider 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} // Truyền state UI
          themeMode={themeMode}
          chatSessions={chatSessions}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          renamingChatId={renamingChatId}
          setRenamingChatId={setRenamingChatId}
          handleRenameChat={handleRenameChat}
          handleDeleteChat={handleDeleteChat}
        />

        <Layout>
          
          <AppHeader
            themeMode={themeMode}
            toggleTheme={toggleTheme}
            screens={screens}
            onNewChat={handleNewChatWrapper}
          />

          <Layout>
            <Content
              className="chatbot-content"
              data-theme={themeMode}
            >
              <ChatWindow messages={messages} messagesEndRef={messagesEndRef} themeMode={themeMode} />

              <RecordingIndicator isRecording={isRecording} themeMode={themeMode} />

              <ChatInput
                input={input}
                setInput={setInput}
                isRecording={isRecording}
                handleSend={handleSend} 
                handleVoiceToggle={handleVoiceToggleWrapper}
                handleFileUpload={handleFileUpload}
                themeMode={themeMode}
                stagedFiles={stagedFiles}
                handleRemoveStagedFile={handleRemoveStagedFile}
              />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default InterviewChatbot;