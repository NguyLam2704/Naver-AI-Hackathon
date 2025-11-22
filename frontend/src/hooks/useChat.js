import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { getCurrentTime, defaultWelcomeMessage } from '../utils/chatHelpers';
import axios from 'axios';

const getApiBaseUrl = () => {
  // 1. Ưu tiên lấy từ biến môi trường (.env)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Nếu không có biến môi trường, tự động detect
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000'; // Local backend
  }
  
  // 3. Trên Vercel production (cùng domain)
  return '/api'; 
};

export const useChat = () => {
  // (SỬA) Xóa logic localStorage, chỉ dùng state tạm thời
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [voiceGender, setVoiceGender] = useState('female'); // 'female' | 'male'
  const [isInterviewFinished, setIsInterviewFinished] = useState(false); // State kết thúc phỏng vấn
  const [interviewResult, setInterviewResult] = useState(""); // Kết quả phỏng vấn
  const aiResponseTimeoutRef = useRef(null);

  // --- LOGIC MEMOIZED ---
  const activeChat = useMemo(() => 
    chatSessions.find(chat => chat.id === activeChatId),
    [chatSessions, activeChatId]
  );
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  // (SỬA) Xóa useEffect lưu localStorage

  // Khởi tạo (chỉ chạy 1 lần) - Tạo session mới luôn
  useEffect(() => {
    if (chatSessions.length === 0) {
      const newChatId = crypto.randomUUID();
      setChatSessions([
        { 
          id: newChatId, 
          title: 'Interview Session', 
          messages: [defaultWelcomeMessage], 
          currentQuestion: 0 
        }
      ]);
      setActiveChatId(newChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- HANDLERS ---
  const uploadFile = useCallback(async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${getApiBaseUrl()}/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    
    return response.data;
  }, []);

  const triggerAiResponse = useCallback(async (userMessage, stagedFiles = []) => {
    if (!activeChatId) return;

    // 1. Chuẩn bị message placeholder cho AI
    const aiMessageId = crypto.randomUUID();
    const aiMessage = { 
      id: aiMessageId,
      sender: 'ai', 
      text: '', 
      time: getCurrentTime(),
      isLoading: true,
      audioUrl: null // Thêm field audioUrl
    };

    setChatSessions(prevSessions => 
      prevSessions.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, aiMessage]
          };
        }
        return chat;
      })
    );

    try {
      // 2. Upload files nếu có
      const fileUris = [];
      if (stagedFiles && stagedFiles.length > 0) {
        for (const file of stagedFiles) {
          if (file.uri) {
             // Đã có URI (đã upload trước đó)
             fileUris.push(file.uri);
          } else if (file.data) {
            // Chưa có URI, upload từ base64 (fallback)
            const blob = await (await fetch(file.data)).blob();
            const formData = new FormData();
            formData.append('file', blob, file.name);

            const uploadRes = await fetch(`${getApiBaseUrl()}/files/upload`, {
              method: 'POST',
              body: formData
            });
            
            if (uploadRes.ok) {
              const data = await uploadRes.json();
              if (data.file_uri) {
                fileUris.push(data.file_uri);
              }
            } else {
              console.error("Upload failed", await uploadRes.text());
              message.error(`Lỗi upload file: ${file.name}`);
            }
          }
        }
      }

      // 3. Gọi API Chat Stream
      const formData = new FormData();
      formData.append('message', userMessage);
      if (fileUris.length > 0) {
        formData.append('file_uris', JSON.stringify(fileUris));
      }
      formData.append('session_id', activeChatId);

      const response = await fetch(`${getApiBaseUrl()}/chat/stream`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // 4. Xử lý Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '');
            if (jsonStr === '[DONE]') break; 

            try {
              const data = JSON.parse(jsonStr);
              
              if (data.type === 'chunk') {
                aiResponseText += data.text;
                
                // Update UI streaming
                setChatSessions(prevSessions => 
                  prevSessions.map(chat => {
                    if (chat.id === activeChatId) {
                      const updatedMessages = chat.messages.map(msg => {
                        if (msg.id === aiMessageId) {
                          return { ...msg, text: aiResponseText, isLoading: false };
                        }
                        return msg;
                      });
                      return { ...chat, messages: updatedMessages };
                    }
                    return chat;
                  })
                );
              } else if (data.type === 'error') {
                message.error(`AI Error: ${data.message}`);
              } else if (data.type === 'done') {
                 // Stream finished
                 if (aiResponseText.includes('[Thank you for your time]')) {
                    setIsInterviewFinished(true);
                    setInterviewResult(aiResponseText);
                 }
              }
            } catch (e) {
              console.error("Error parsing SSE:", e);
            }
          }
        }
      }

      // 5. Gọi TTS sau khi stream xong
      if (aiResponseText.trim()) {
        try {
          const ttsEndpoint = voiceGender === 'male' 
            ? `${getApiBaseUrl()}/chat/male-voice/audio`
            : `${getApiBaseUrl()}/chat/female-voice/audio`;
          
          const ttsRes = await fetch(ttsEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: aiResponseText })
          });

          if (ttsRes.ok) {
            const audioBlob = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            setChatSessions(prevSessions => 
              prevSessions.map(chat => {
                if (chat.id === activeChatId) {
                  const updatedMessages = chat.messages.map(msg => {
                    if (msg.id === aiMessageId) {
                      return { ...msg, audioUrl: audioUrl };
                    }
                    return msg;
                  });
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              })
            );
          } else {
            console.error("TTS Failed", await ttsRes.text());
          }
        } catch (ttsError) {
          console.error("TTS Error:", ttsError);
        }
      }

    } catch (error) {
      console.error("Chat Error:", error);
      message.error("Có lỗi xảy ra khi kết nối với AI.");
      
      // Update message to show error
      setChatSessions(prevSessions => 
        prevSessions.map(chat => {
          if (chat.id === activeChatId) {
            const updatedMessages = chat.messages.map(msg => {
              if (msg.id === aiMessageId) {
                return { ...msg, text: "Xin lỗi, tôi đang gặp sự cố kết nối.", isLoading: false, isError: true };
              }
              return msg;
            });
            return { ...chat, messages: updatedMessages };
          }
          return chat;
        })
      );
    }
  }, [activeChatId, voiceGender]); 

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
    handleDeleteChat,
    voiceGender,
    setVoiceGender,
    isInterviewFinished,
    interviewResult,
    uploadFile
  };
};