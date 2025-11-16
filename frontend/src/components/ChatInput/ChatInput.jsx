import { Button, Tooltip, Input, Upload, Space } from 'antd';
import {
  AudioOutlined,
  AudioMutedOutlined,
  PaperClipOutlined,
  SendOutlined,
  CloseOutlined, 
  FileOutlined,
} from '@ant-design/icons';

import './ChatInput.css';

const ChatInput = ({ 
  input, 
  setInput, 
  isRecording, 
  handleSend, 
  handleVoiceToggle, 
  handleFileUpload, 
  themeMode,
  stagedFiles,          
  handleRemoveStagedFile 
}) => {
  return (
    <div
      className="chat-input-wrapper"
      data-theme={themeMode}
    >
      {/* (MỚI) Khu vực hiển thị file đang chờ */}
      {stagedFiles && stagedFiles.length > 0 && (
        <div className="staged-files-container" data-theme={themeMode}>
          <Space wrap size={[8, 8]}>
            {stagedFiles.map((file, index) => (
              <div key={index} className="staged-file-item" data-theme={themeMode}>
                {file.type === 'image' ? (
                  // (SỬA) Dùng file.data (base64) thay vì file.url (blob)
                  <img src={file.data} alt={file.name} className="staged-file-thumbnail" />
                ) : (
                  <FileOutlined className="staged-file-icon" />
                )}
                <span className="staged-file-name" title={file.name}>{file.name}</span>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined />}
                  className="staged-file-remove"
                  onClick={() => handleRemoveStagedFile(index)}
                />
              </div>
            ))}
          </Space>
        </div>
      )}

      {/* Thanh Input chính */}
      <div
        className="chat-input-bar"
        data-theme={themeMode}
      >
        <Tooltip title={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}>
          <Button
            size="large"
            icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={handleVoiceToggle}
            type="text"
            danger={isRecording}
            className="chat-input-button"
            data-theme={themeMode}
            data-recording={isRecording}
          />
        </Tooltip>
        <Upload
          accept=".pdf,.png,.jpg,.jpeg"
          showUploadList={false}
          onChange={handleFileUpload}
          beforeUpload={() => false} 
          multiple 
        >
          <Tooltip title="Đính kèm file">
            <Button
              size="large"
              icon={<PaperClipOutlined />}
              type="text"
              className="chat-input-button"
              data-theme={themeMode}
            />
          </Tooltip>
        </Upload>
        <Input
          size="large"
          placeholder="Gửi tin nhắn" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
          className="chat-input-field"
        />
        <Tooltip title="Gửi tin nhắn">
          <Button
            size="large"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            // Cập nhật logic disabled: Chỉ bật khi có text hoặc có file
            disabled={!input.trim() && stagedFiles.length === 0}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default ChatInput;

