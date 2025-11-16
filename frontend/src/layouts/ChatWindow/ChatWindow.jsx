import { Space, Avatar } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

import './ChatWindow.css';

const ChatWindow = ({ messages, messagesEndRef, themeMode }) => {
  return (
    <div className="chat-window-scroll">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          // Dùng className và data-sender
          className="chat-message-row"
          data-sender={msg.sender}
        >
          <div className="chat-message-container">
            {msg.sender === 'ai' && (
              <Space className="chat-ai-header">
                <Avatar
                  size={32}
                  icon={<RobotOutlined />}
                  // Dùng className và data-theme
                  className="chat-ai-avatar"
                  data-theme={themeMode}
                />
                <span
                  // Dùng className và data-theme
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
                className="chat-image-bubble"
                data-sender={msg.sender}
              />
            ) : (
              <div
                className={`
                  chat-text-bubble
                  ${msg.sender === 'user'
                    ? (themeMode === 'dark' ? 'chat-bubble-user-dark' : 'chat-bubble-user')
                    : (themeMode === 'dark' ? 'chat-bubble-ai-dark' : 'chat-bubble-ai-light')}
                `}
                data-sender={msg.sender}
              >
                {msg.text}
              </div>
            )}

            <div
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