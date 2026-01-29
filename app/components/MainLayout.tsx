'use client';

import React from 'react';
import { Layout, Menu, theme, ConfigProvider } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

const { Header, Content, Footer } = Layout;

// 动态导入避免SSR水合不匹配
const ReviewNavBadge = dynamic(() => import('./ReviewNavBadge'), { ssr: false });
const WrongQuestionNavBadge = dynamic(() => import('./WrongQuestionNavBadge'), { ssr: false });

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    { key: '/', label: '主页' },
    { key: '/learning-setup', label: '系统学习' },
    { key: '/knowledge-map', label: '知识图谱' },
    { key: '/notes', label: '记录所思' },
    { key: '/unified-chat', label: 'AI对话' },
    { key: '/learning-history', label: '自学历史' },
    { key: '/knowledge-base', label: '知识库' },
    { key: '/wrong-book', label: '错题本' },
  ];

  // 简单的路由匹配逻辑，高亮当前菜单
  const selectedKey = menuItems.find(item => pathname === item.key || (item.key !== '/' && pathname.startsWith(item.key)))?.key || '/';

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#667eea', // 智学引擎主题紫蓝色
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#fff', 
          padding: '0 24px', 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)' 
        }}>
          <div className="demo-logo" style={{ marginRight: '48px', display: 'flex', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                color: '#fff',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                boxShadow: '0 4px 10px rgba(56, 189, 248, 0.3)'
              }}>
                <Brain size={22} strokeWidth={2.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                <span style={{
                  background: 'linear-gradient(90deg, #0f172a 0%, #334155 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px'
                }}>智学引擎</span>
                <span style={{
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}>SMART LEARNING</span>
              </div>
            </Link>
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems.map(item => ({
              key: item.key,
              label: <Link href={item.key} style={{ textDecoration: 'none' }}>{item.label}</Link>,
            }))}
            style={{ flex: 1, minWidth: 0, borderBottom: 'none', fontSize: '15px' }}
          />
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
             <ReviewNavBadge />
             <WrongQuestionNavBadge />
          </div>
        </Header>
        <Content style={{ background: '#f8fafc' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ minHeight: '100%' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
