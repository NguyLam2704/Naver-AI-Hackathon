import { Space } from 'antd';

import './RecordingIndicator.css';

const RecordingIndicator = ({ isRecording, themeMode }) => {
  if (!isRecording) return null;

  return (
    <div
      className="recording-indicator-wrapper"
      data-theme={themeMode}
    >
      <Space>
        <div className="recording-bar">
          <div />
          <div />
          <div />
        </div>
        <span 
          className="recording-indicator-text"
        >
          Recording...
        </span>
      </Space>
    </div>
  );
};

export default RecordingIndicator;