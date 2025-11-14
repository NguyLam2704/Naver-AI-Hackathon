import { Space } from 'antd';

import './RecordingIndicator.css';

const RecordingIndicator = ({ isRecording, themeMode }) => {
  if (!isRecording) return null;

  return (
    <div
      // (SỬA) Dùng className và data-theme
      className="recording-indicator-wrapper"
      data-theme={themeMode}
    >
      <Space>
        <div className="recording-bar">
          {/* (SỬA) Xóa inline styles, chúng đã ở trong file CSS */}
          <div />
          <div />
          <div />
        </div>
        <span 
          // (SỬA) Dùng className
          className="recording-indicator-text"
        >
          Recording...
        </span>
      </Space>
    </div>
  );
};

export default RecordingIndicator;