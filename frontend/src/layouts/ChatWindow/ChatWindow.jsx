import { Space, Avatar } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './ChatWindow.css';

const ChatWindow = ({ messages, messagesEndRef, themeMode }) => {
  return (
    <div className="chat-window-scroll">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          // (SỬA) Dùng className và data-sender
          className="chat-message-row"
          data-sender={msg.sender}
        >
          <div className="chat-message-container">
            {msg.sender === 'ai' && (
              <Space className="chat-ai-header">
                <Avatar
                  size={32}
                  icon={<RobotOutlined />}
                  // (SỬA) Dùng className và data-theme
                  className="chat-ai-avatar"
                  data-theme={themeMode}
                />
                <span
                  // (SỬA) Dùng className và data-theme
                  className="chat-ai-name"
                  data-theme={themeMode}
                >
                  AI Assistant
                </span>
              </Space>
            )}

            {msg.type === 'image' ? (
              <img
                src={msg.text}
                alt="Uploaded content"
                // (SỬA) Dùng className và data-sender
                className="chat-image-bubble"
                data-sender={msg.sender}
              />
            ) : (
              // Chỉ hiển thị bubble nếu có text HOẶC (không phải đang loading)
              // Nếu đang loading mà chưa có text thì ẩn bubble đi (để hiện dots)
              (msg.text || !msg.isLoading) && (
                <div
                  // (SỬA) Kết hợp className động (màu sắc) và className tĩnh (bố cục)
                  className={`
                    chat-text-bubble
                    ${msg.sender === 'user'
                      ? (themeMode === 'dark' ? 'chat-bubble-user-dark' : 'chat-bubble-user')
                      : (themeMode === 'dark' ? 'chat-bubble-ai-dark' : 'chat-bubble-ai-light')}
                  `}
                  // (SỬA) Thêm data-sender để xử lý bo góc
                  data-sender={msg.sender}
                >
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p style={{margin: 0}} {...props} />
                      }}
                    >
                      {msg.text ? msg.text.replace(/\[Thank you for your time\]/g, '') : ''}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              )
            )}

            {/* Audio Player for AI */}
            {msg.sender === 'ai' && msg.audioUrl && (
              <div className="chat-audio-player" data-theme={themeMode}>
                <audio controls autoPlay src={msg.audioUrl} />
              </div>
            )}
            
            {/* Loading Dots */}
            {msg.sender === 'ai' && msg.isLoading && !msg.text && (
               <div className="typing-indicator" data-theme={themeMode}>
                 <span></span>
                 <span></span>
                 <span></span>
               </div>
            )}

            <div
              // (SỬA) Dùng className và data-attributes
              className="chat-message-time"
              data-theme={themeMode}
              data-sender={msg.sender}
            >
              {msg.time}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;