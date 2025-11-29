import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Result, Divider } from 'antd';
import { HomeOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ResultPage.css';

const { Title, Paragraph, Text } = Typography;

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resultText } = location.state || { resultText: "Không có dữ liệu kết quả." };

  // Clean up the result text (remove the closing tag if desired, or keep it)
  // The prompt says "The closing statement MUST begin with...". 
  // We might want to remove "[Thank you for your time]" for cleaner UI, or keep it.
  // Let's keep it but format it.
  
  const formattedText = resultText.replace('[Thank you for your time]', '').trim();

  return (
    <div className="result-page-container">
      <Card className="result-card">
        <Result
          icon={<FileTextOutlined style={{ color: '#1677ff' }} />}
          title="Kết quả Phỏng vấn"
          subTitle="Dưới đây là tổng hợp đánh giá và nhận xét từ AI Interviewer."
        />
        
        <Divider />
        
        <div className="result-content">
          <Title level={4}>Chi tiết đánh giá:</Title>
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {formattedText}
            </ReactMarkdown>
          </div>
        </div>

        <Divider />

        <div className="result-actions">
          <Button 
            type="primary" 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/')}
            size="large"
          >
            Về trang chủ
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => navigate('/')}
            size="large"
          >
            Phỏng vấn lại
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResultPage;
