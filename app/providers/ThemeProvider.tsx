'use client';

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { PropsWithChildren } from 'react';

/**
 * 全局主题配置提供者
 *
 * 统一配置 Ant Design 的主题色、边框半径等样式
 */
export default function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // 主色调统一为 #165DFF
          colorPrimary: '#165DFF',

          // 边框半径
          borderRadius: 6,

          // 字体大小
          fontSize: 14,

          // 成功色
          colorSuccess: '#00C9A7',

          // 警告色
          colorWarning: '#FF991F',

          // 错误色
          colorError: '#F53F3F',

          // 信息色
          colorInfo: '#165DFF',
        },
        components: {
          Button: {
            // 按钮边框半径
            borderRadius: 6,
            // 按钮阴影
            boxShadow: 'none',
          },
          Card: {
            // 卡片边框半径
            borderRadiusLG: 8,
          },
          Input: {
            // 输入框边框半径
            borderRadius: 6,
          },
          Select: {
            // 选择器边框半径
            borderRadius: 6,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
