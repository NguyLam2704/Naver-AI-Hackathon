import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Typography, ConfigProvider, theme, Divider } from 'antd';
import { HomeOutlined, ReloadOutlined, CheckCircleFilled, FileTextOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ResultPage.css';

const { Title, Text } = Typography;
const { defaultAlgorithm, darkAlgorithm } = theme;

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resultText } = location.state || { resultText: `
## Interview Feedback

Hello, below is a detailed review of your recent interview.

## Strengths
- Strong foundational knowledge: You have a solid grasp of core React and JavaScript concepts.
- Confident communication: Clear and coherent speech.

## Areas for Improvement
1. Answer structure: Consider using the STAR method to respond to situational questions.
2. Technical depth: Dive deeper into performance optimization techniques (e.g., useMemo, useCallback).

## Advice
 Practice more problems on algorithms and data structures.

Wishing you the best of luck next time!
    ` 
  };

  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') || 'light';
    setCurrentTheme(savedTheme);
  }, []);

  const formattedText = resultText.replace('[Thank you for your time]', '').trim();

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? darkAlgorithm : defaultAlgorithm,
        token: {
          fontFamily: "'Inter', sans-serif",
          colorPrimary: '#1677ff',
        }
      }}
    >
      <div className="result-page-wrapper" data-theme={currentTheme}>
        
        {/* Header Bar cố định phía trên */}
        <header className="result-navbar">
          <div className="navbar-brand">
            <FileTextOutlined className="brand-icon" />
            <span>AI Interview Report</span>
          </div>
          <div className="navbar-actions">
            <Button 
              type="text" 
              icon={<HomeOutlined />} 
              onClick={() => navigate('/')}
              size="large"
            >
              Home
            </Button>
          </div>
        </header>

        {/* Nội dung chính dạng văn bản/báo cáo */}
        <main className="result-main-container">
          
          {/* Phần tiêu đề báo cáo */}
          <div className="report-header">
             <div className="report-status">
                <CheckCircleFilled className="success-icon" />
                <div className="status-text">
                  <Title level={2} style={{ margin: 0 }} className='result-main-title'>Interview Report</Title>
                  <Text type="secondary">Generated automatically by the AI system on {new Date().toLocaleDateString('vi-VN')}</Text>
                </div>
             </div>
          </div>

          <Divider />
          {/* Phần nội dung Markdown */}
          <div className="report-body">
             <div className="markdown-viewer">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {formattedText}
                </ReactMarkdown>
             </div>
          </div>

          <Divider />

          {/* Footer Actions */}
          <div className="report-footer">
            <Button 
              type="primary" 
              size="large" 
              icon={<ReloadOutlined />} 
              onClick={() => navigate('/')}
              className="action-btn"
            >
              Practice again
            </Button>
          </div>

        </main>
      </div>
    </ConfigProvider>
  );
};

export default ResultPage;
