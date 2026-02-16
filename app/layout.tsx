import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import 'katex/dist/katex.min.css'
import AntdRegistry from './lib/AntdRegistry'
import MainLayout from './components/MainLayout'
import ThemeProvider from './providers/ThemeProvider'
import ErrorBoundary from './components/ErrorBoundary'

export const metadata: Metadata = {
  title: '智学引擎',
  description: '智学引擎：AI驱动的个性化学习系统，精准诊断、智能讲解、高效提分',
  openGraph: {
    title: '智学引擎',
    description: 'AI驱动的个性化学习系统，精准诊断、智能讲解、高效提分',
    siteName: '智学引擎',
    images: [
      { url: '/intelligent.jpg', width: 1200, height: 630, alt: '智学引擎' }
    ],
    locale: 'zh_CN',
    type: 'website'
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="zh-CN">
        {/* 使用系统字体，避免构建时联网下载 Google Fonts 导致 ECONNRESET */}
        <body className="min-h-screen bg-slate-50 font-sans">
          <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
            '@context':'https://schema.org', '@type':'WebSite', name:'智学引擎',
          })}} />
          
          <ErrorBoundary>
            <AntdRegistry>
              <ThemeProvider>
                {/* 使用 suppressHydrationWarning 消除某些插件或扩展导致的不匹配警告 */}
                <div suppressHydrationWarning>
                  <MainLayout>
                    {children}
                  </MainLayout>
                </div>
              </ThemeProvider>
            </AntdRegistry>
          </ErrorBoundary>

          <Toaster
            position="top-right"
            containerStyle={{
              top: 80, // Position below header
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#1f2937',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: 500,
                maxWidth: '400px',
              },
              success: {
                style: {
                  borderLeft: '4px solid #10B981',
                },
                iconTheme: { primary: '#10B981', secondary: '#fff' }
              },
              error: {
                style: {
                  borderLeft: '4px solid #EF4444',
                },
                iconTheme: { primary: '#EF4444', secondary: '#fff' }
              },
              loading: {
                style: {
                  borderLeft: '4px solid #6366F1',
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
