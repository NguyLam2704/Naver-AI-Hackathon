import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import GlobalStyles from '../components/GlobalStyle/GlobalStyles';
import AppSider from './AppSider/AppSider';
import AppHeader from './AppHeader/AppHeader';
import ChatWindow from './ChatWindow/ChatWindow';
import RecordingIndicator from '../components/RecordingIndicator/RecordingIndicator';
import ChatInput from '../components/ChatInput/ChatInput';


import './InterviewChatbot.css'; 


import { Layout, ConfigProvider, theme, Grid, message, Modal, Upload, Button, Radio, Tabs, Input, Alert } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';

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
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false); // UI State có thể giữ lại
  const [isSetupComplete, setIsSetupComplete] = useState(false); // State cho màn hình setup
  const [setupMode, setSetupMode] = useState('upload'); // 'upload' | 'topic'
  const [selectedTopic, setSelectedTopic] = useState('');
  const [fileList, setFileList] = useState([]); // State quản lý danh sách file và tiến trình upload
  const [showBanner, setShowBanner] = useState(true);

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
    handleDeleteChat,
    voiceGender,
    setVoiceGender,
    isInterviewFinished,
    interviewResult,
    uploadFile
  } = useChat();
  
  const { 
    stagedFiles, 
    setStagedFiles, 
    handleFileUpload, 
    handleRemoveStagedFile 
  } = useFiles();

  // --- CUSTOM UPLOAD HANDLER FOR MODAL ---
  const handleModalFileUpload = async (info) => {
    // Antd Upload onChange gives { file, fileList, event }
    // We use beforeUpload={false} so we handle the file manually
    const fileObj = info.file.originFileObj || info.file;
    
    // Check if already processing or done
    if (info.file.status === 'uploading' || info.file.status === 'done') return;

    // Tạo entry mới trong fileList
    const newFileItem = {
      uid: fileObj.uid,
      name: fileObj.name,
      status: 'uploading',
      percent: 0,
    };

    setFileList(prev => [...prev, newFileItem]);

    try {
        // message.loading({ content: `Đang tải lên ${fileObj.name}...`, key: 'uploading' }); // Bỏ loading message vì đã có progress bar
        
        const data = await uploadFile(fileObj, (percent) => {
          // Update progress
          setFileList(prev => prev.map(f => {
            if (f.uid === fileObj.uid) {
              return { ...f, percent: percent };
            }
            return f;
          }));
        });
        
        // Update success status
        setFileList(prev => prev.map(f => {
          if (f.uid === fileObj.uid) {
            return { ...f, status: 'done', percent: 100 };
          }
          return f;
        }));

        setStagedFiles(prev => [...prev, {
            name: fileObj.name,
            uri: data.file_uri, // Store URI
            type: fileObj.type.startsWith('image/') ? 'image' : 'file',
            data: null 
        }]);
        message.success({ content: 'Tải lên thành công!', key: 'uploading' });
    } catch (e) {
        console.error(e);
        // Update error status
        setFileList(prev => prev.map(f => {
          if (f.uid === fileObj.uid) {
            return { ...f, status: 'error' };
          }
          return f;
        }));
        message.error({ content: 'Lỗi tải lên file.', key: 'uploading' });
    }
  };

  // --- SETUP HANDLER ---
  const handleStartInterview = () => {
    setIsSetupComplete(true);
    
    let initialUserMessage = "";
    let aiPrompt = "";
    let filesToSend = [];

    if (setupMode === 'upload' && stagedFiles.length > 0) {
        initialUserMessage = `Uploaded CV/JD: ${stagedFiles.map(f => f.name).join(', ')}`;
        aiPrompt = "This is my CV/JD. Please start the interview based on this information. Hello.";
        filesToSend = stagedFiles;
    } else if (setupMode === 'topic' && selectedTopic.trim()) {
        initialUserMessage = `Selected interview topic: ${selectedTopic}`;
        aiPrompt = `I want to be interviewed on the topic: ${selectedTopic}. Please start the interview. Hello.`;
    } else {
        // Fallback
        initialUserMessage = "Hello, I am ready.";
        aiPrompt = "Hello, I am ready for the interview. Let's start.";
    }

    // 1. Hiển thị tin nhắn của User (Fake UI message)
    const userMsgObject = {
        sender: 'user',
        text: initialUserMessage,
        time: getCurrentTime(),
        type: 'text'
    };

    // Nếu có file ảnh thì hiển thị thêm (optional, nhưng user yêu cầu "tin nhắn trống" -> có thể ý là chỉ hiện text thông báo)
    // Ở đây ta chỉ hiện text thông báo "Đã chọn..." như yêu cầu.

    setChatSessions(prevSessions =>
        prevSessions.map(chat => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [...chat.messages, userMsgObject]
            };
          }
          return chat;
        })
    );
    
    // 2. Gọi AI với prompt thực tế (ẩn)
    triggerAiResponse(aiPrompt, filesToSend);
    
    // Clear staged files sau khi gửi
    setStagedFiles([]); 
    setFileList([]); // Clear file list UI
  };

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
    setFileList([]); // Clear file list UI

    // 5. Kích hoạt AI
    triggerAiResponse(currentInput, stagedFiles);
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
    setFileList([]); // Clear file list UI
    handleNewChat(); // Gọi hàm gốc từ useChat
    
    // Mở lại modal setup cho session mới
    setIsSetupComplete(false);
    setSetupMode('upload');
    setSelectedTopic('');
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

      {/* SETUP MODAL */}
      <Modal
        title="Thiết lập phỏng vấn"
        open={!isSetupComplete}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
        width={500}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <Tabs
            defaultActiveKey="upload"
            onChange={(key) => setSetupMode(key)}
            items={[
              {
                key: 'upload',
                label: 'Tải lên CV/JD',
                children: (
                  <div>
                    <p style={{ marginBottom: 8 }}>Vui lòng tải lên CV hoặc JD để AI hiểu rõ hơn về bạn:</p>
                    <Upload
                      beforeUpload={() => false} // Prevent auto upload
                      onChange={handleModalFileUpload}
                      fileList={fileList}
                      onRemove={(file) => {
                        handleRemoveStagedFile(file.uid);
                        setFileList(prev => prev.filter(f => f.uid !== file.uid));
                      }}
                      maxCount={3}
                    >
                      <Button icon={<UploadOutlined />}>Tải lên CV/JD</Button>
                    </Upload>
                  </div>
                ),
              },
              {
                key: 'topic',
                label: 'Chọn chủ đề',
                children: (
                  <div>
                    <p style={{ marginBottom: 8 }}>Chọn chủ đề phổ biến:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {['IT (Công nghệ thông tin)', 'Marketing', 'Sales (Kinh doanh)', 'Customer Service (CSKH)', 'Human Resources (Nhân sự)', 'Graphic Design'].map(topic => (
                        <Button 
                          key={topic} 
                          size="small" 
                          onClick={() => setSelectedTopic(topic)}
                          type={selectedTopic === topic ? 'primary' : 'default'}
                        >
                          {topic}
                        </Button>
                      ))}
                    </div>
                    <p style={{ marginBottom: 8 }}>Hoặc nhập chủ đề khác:</p>
                    <Input 
                        placeholder="Nhập chủ đề..." 
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                    />
                  </div>
                ),
              },
            ]}
          />
          
          <div>
            <p style={{ marginBottom: 8 }}>Chọn giọng nói cho người phỏng vấn:</p>
            <Radio.Group onChange={(e) => setVoiceGender(e.target.value)} value={voiceGender} buttonStyle="solid">
              <Radio.Button value="female">Nữ (Clara)</Radio.Button>
              <Radio.Button value="male">Nam (Matt)</Radio.Button>
            </Radio.Group>
          </div>

          <Button 
            type="primary" 
            onClick={handleStartInterview} 
            size="large" 
            block
            disabled={ (setupMode === 'upload' && stagedFiles.length === 0) || (setupMode === 'topic' && !selectedTopic.trim()) }
          >
            Bắt đầu phỏng vấn
          </Button>
        </div>
      </Modal>

      <Layout 
        className="chatbot-layout"
      >
        {/* Ẩn Sider */}
        {/* <AppSider ... /> */}

        <Layout>
          {showBanner && (
            <Alert
              message="Trang web hiện tại chỉ mới hỗ trợ interview bằng tiếng Anh."
              type="info"
              closable
              onClose={() => setShowBanner(false)}
              style={{ borderRadius: 0, textAlign: 'center' }}
              banner
            />
          )}
          
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

              <div style={{ padding: '0 16px 8px', fontSize: '12px', color: '#888', textAlign: 'right' }}>
                Voice: <b>{voiceGender === 'female' ? 'Nữ' : 'Nam'}</b>
              </div>

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
                inputRef={inputRef}
              />
              
              {/* Button xem kết quả khi phỏng vấn kết thúc */}
              {isInterviewFinished && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '100px', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  zIndex: 1000 
                }}>
                  <Button 
                    type="primary" 
                    shape="round" 
                    size="large" 
                    icon={<CheckCircleOutlined />}
                    onClick={() => navigate('/result', { state: { resultText: interviewResult } })}
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                  >
                    Xem kết quả phỏng vấn
                  </Button>
                </div>
              )}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default InterviewChatbot;