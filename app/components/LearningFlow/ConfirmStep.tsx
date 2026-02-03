'use client'

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BookOutlined } from '@ant-design/icons';
import MarkdownRenderer from '../MarkdownRenderer';

const { Title, Paragraph } = Typography;

interface ConfirmStepProps {
  content: string;
  isLoading?: boolean;
  onConfirmUnderstanding: () => void;
  onContinueExplanation: () => void;
  showConfirmation?: boolean;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  content,
  isLoading = false,
  onConfirmUnderstanding,
  onContinueExplanation,
  showConfirmation = false
}) => {
  const [userChoice, setUserChoice] = useState<string>('');

  const handleConfirm = () => {
    setUserChoice('confirmed');
    onConfirmUnderstanding();
  };

  const handleContinue = () => {
    setUserChoice('continue');
    onContinueExplanation();
  };

  return (
    <Card
      style={{ maxWidth: 900, margin: '0 auto' }}
      title={
        <Space>
          <BookOutlined style={{ fontSize: 24, color: '#165DFF' }} />
          <Title level={3} style={{ margin: 0 }}>知识理解确认</Title>
        </Space>
      }
    >
      {/* 知识内容 */}
      <Card
        type="inner"
        style={{ marginBottom: showConfirmation ? 24 : 0, backgroundColor: '#fafafa' }}
      >
        <div className="prose prose-lg max-w-none">
          <MarkdownRenderer content={content} fontSize="lg" />
        </div>
      </Card>

      {/* 确认按钮区域 */}
      {showConfirmation && !isLoading && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
          <Paragraph style={{ textAlign: 'center', fontSize: 16, marginBottom: 24 }}>
            请确认你是否已经理解了以上知识点和解题方法？
          </Paragraph>

          <Space direction="vertical" size="middle" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <Space size="middle" wrap>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirm}
                disabled={userChoice !== ''}
                style={{
                  minWidth: 200,
                  backgroundColor: userChoice === 'confirmed' ? '#52c41a' : undefined,
                  opacity: userChoice !== '' && userChoice !== 'confirmed' ? 0.5 : 1
                }}
              >
                确认理解，进行测验
              </Button>

              <Button
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={handleContinue}
                disabled={userChoice !== ''}
                danger={userChoice === '' || userChoice === 'continue'}
                style={{
                  minWidth: 200,
                  opacity: userChoice !== '' && userChoice !== 'continue' ? 0.5 : 1
                }}
              >
                需要继续讲解
              </Button>
            </Space>
          </Space>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin size="large" tip="正在处理..." />
        </div>
      )}
    </Card>
  );
};

export default ConfirmStep;
