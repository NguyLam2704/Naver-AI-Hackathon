import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import GlobalStyles from '../components/GlobalStyle/GlobalStyles';
import AppSider from './AppSider/AppSider';
import AppHeader from './AppHeader/AppHeader';
import ChatWindow from './ChatWindow/ChatWindow';
import RecordingIndicator from '../components/RecordingIndicator/RecordingIndicator';
import ChatInput from '../components/ChatInput/ChatInput';

import './InterviewChatbot.css'; 

import { Layout ,ConfigProvider, theme, Grid, message, Drawer } from 'antd'; 

import { useTheme } from '../hooks/useTheme';
import { useChat } from '../hooks/useChat';
import { useFiles } from '../hooks/useFiles';
import { useSpeech } from '../hooks/useSpeech';

import { getCurrentTime, recognition } from '../utils/chatHelpers'; 

const { Content, Footer } = Layout; 
const { darkAlgorithm, defaultAlgorithm } = theme;
const { useBreakpoint } = Grid; 

const InterviewChatbot = () => {
  const screens = useBreakpoint();
  const messagesEndRef = useRef(null);
  
  // Dùng state này, BỎ state 'collapsed' cũ
  const [isSiderVisible, setIsSiderVisible] = useState(false); 
  
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
  
  // Lọc danh sách file, BỎ QUA những file đã bị ẩn
  const fileMessages = useMemo(() => 
    messages.filter(msg => 
      (msg.type === 'image' || msg.type === 'file') && !msg.isHiddenFromFileList
    ),
    [messages]
  );
  
  const { 
    stagedFiles, 
    setStagedFiles, 
    handleFileUpload, 
    handleRemoveStagedFile 
  } = useFiles();
  
  const { 
    input, 
    setInput, 
    isRecording, 
    setIsRecording,
    handleVoiceToggle, 
    silenceTimeoutRef,
    inputRef 
  } = useSpeech();
  
  const handleSend = useCallback(() => {
    if (isRecording) {
      setIsRecording(false); 
    }
    const currentInput = inputRef.current; 
    if (!currentInput.trim() && stagedFiles.length === 0) return;
    let newTitle = null; 
    let titleUpdated = false;
    const newMessages = []; 
    if (currentInput.trim()) {
      newMessages.push({ 
        id: crypto.randomUUID(),
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
    if (stagedFiles.length > 0) {
      stagedFiles.forEach(file => {
        newMessages.push({
          id: crypto.randomUUID(),
          sender: 'user',
          text: file.type === 'image' ? file.data : file.name, 
          name: file.name, 
          data: file.data, 
          time: getCurrentTime(),
          type: file.type,
          isHiddenFromFileList: false 
        });
        if (activeChat && activeChat.title === 'New Chat' && !newTitle) {
          newTitle = file.name;
          titleUpdated = true;
        }
      });
    }
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
    setInput(''); 
    setStagedFiles([]);
    triggerAiResponse();
  }, [activeChat, activeChatId, isRecording, setIsRecording, setChatSessions, setInput, setStagedFiles, stagedFiles, triggerAiResponse, inputRef]);
  
  // Thêm Ref cho handleSend để fix lỗi vòng lặp
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  useEffect(() => {
    if (!recognition) return;
    const clearSilenceTimeout = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
    if (isRecording) {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Lỗi khi bắt đầu ghi âm (có thể đã bắt đầu):", e);
      }
      
      recognition.onresult = (event) => {
        clearSilenceTimeout(); 
        let interim_transcript = '';
        let final_transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                final_transcript += transcript + ' ';
            } else {
                interim_transcript += transcript;
            }
        }
        setInput(final_transcript + interim_transcript);
      };
      recognition.onspeechend = () => {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
              console.log("15s im lặng, tự động ngắt...");
              setIsRecording(false); 
              const finalInput = inputRef.current;
              
              if (finalInput.trim() || stagedFiles.length > 0) {
                  handleSendRef.current(); 
              }
          }, 15000);
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        clearSilenceTimeout();
        setIsRecording(false);
      };
      recognition.onend = () => {
        clearSilenceTimeout();
        setIsRecording(false);
      };
    } else {
      recognition.stop();
      clearSilenceTimeout();
    }
    return () => {
      if (recognition) recognition.stop();
      clearSilenceTimeout();
    };
  }, [isRecording, setIsRecording, setInput, silenceTimeoutRef, inputRef, stagedFiles]); 
  
  
  const handleNewChatWrapper = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setIsRecording(false);
    setInput('');
    setStagedFiles([]); 
    handleNewChat(); 
    if (!screens.lg) {
      setIsSiderVisible(false);
    }
  };
  
  const handleVoiceToggleWrapper = () => {
      const success = handleVoiceToggle();
      if (!success) {
           message.error('Trình duyệt không hỗ trợ Speech-to-Text');
      }
  };

  // Hàm xóa file (là "ẩn" file)
  const handleDeleteFileMessage = (messageId) => {
    setChatSessions(prevSessions =>
      prevSessions.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, isHiddenFromFileList: true } // Thêm flag
                : msg
            )
          };
        }
        return chat;
      })
    );
    message.success('Đã ẩn file khỏi danh sách!');
  };

  //
  const handleRenameFileMessage = (messageId, newName) => {
    if (!newName.trim()) return;
    setChatSessions(prevSessions =>
      prevSessions.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === messageId ? { ...msg, name: newName } : msg
            )
          };
        }
        return chat;
      })
    );
  };
  
  //
  const renderSider = (isMobile = false) => (
    <AppSider 
      isMobile={isMobile}
      collapsed={!isSiderVisible && !isMobile} 
      onToggle={() => setIsSiderVisible(!isSiderVisible)} 
      onClose={() => setIsSiderVisible(false)} 
      onNewChat={handleNewChatWrapper} 
      
      themeMode={themeMode}
      chatSessions={chatSessions}
      activeChatId={activeChatId}
      setActiveChatId={(id) => {
        setActiveChatId(id);
        if (isMobile) setIsSiderVisible(false); 
      }}
      renamingChatId={renamingChatId}
      setRenamingChatId={setRenamingChatId}
      handleRenameChat={handleRenameChat}
      handleDeleteChat={handleDeleteChat}

      fileMessages={fileMessages} 
      handleRenameFileMessage={handleRenameFileMessage}
      handleDeleteFileMessage={handleDeleteFileMessage}
    />
  );

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
        
        {screens.lg ? (
          renderSider(false)
        ) : (
          <Drawer
            placement="left"
            onClose={() => setIsSiderVisible(false)}
            open={isSiderVisible}
            closable={false}
            width={260} 
            bodyStyle={{ padding: 0 }}
          >
            {renderSider(true)}
          </Drawer>
        )}

        <Layout style={{ height: '100dvh', overflow: 'hidden' }}>
          
          <AppHeader
            themeMode={themeMode}
            toggleTheme={toggleTheme}
            screens={screens}
            onNewChat={handleNewChatWrapper}
            onToggleSider={() => setIsSiderVisible(!isSiderVisible)}
            activeChatTitle={activeChat?.title || "InterviewAI"}
          />

          <Layout> 
            <Content
              className="chatbot-content"
              data-theme={themeMode}
            >
              <ChatWindow messages={messages} messagesEndRef={messagesEndRef} themeMode={themeMode} />
            </Content>

            <Footer className="chatbot-footer" data-theme={themeMode}>
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
            </Footer>
          </Layout>
          
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default InterviewChatbot;