// // @ts-nocheck
// import type { Metadata } from 'next'
// import './globals.css'
// import { Inter } from 'next/font/google'
// import { Toaster } from 'react-hot-toast'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: '自学系统',
//   description: '以自学为基础，以生产为导向',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="zh-CN">
//       <body className={`${inter.className} min-h-screen bg-astronaut`}>
//         {children}
//         <Toaster 
//           position="top-right"
//           toastOptions={{
//             duration: 3000,
//             style: {
//               background: '#fff',
//               color: '#333',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//               borderRadius: '8px',
//               padding: '12px 16px',
//             },
//             success: {
//               iconTheme: {
//                 primary: '#10B981',
//                 secondary: '#fff',
//               },
//             },
//             error: {
//               iconTheme: {
//                 primary: '#EF4444',
//                 secondary: '#fff',
//               },
//             },
//           }}
//         />
//       </body>
//     </html>
//   )
// }

// @ts-nocheck
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import 'katex/dist/katex.min.css'
import dynamic from 'next/dynamic'

const ReviewNavBadge = dynamic(() => import('./components/ReviewNavBadge'), { ssr: false })
const WrongQuestionNavBadge = dynamic(() => import('./components/WrongQuestionNavBadge'), { ssr: false })

export const metadata: Metadata = {
  title: '自学系统',
  description: '天·才自学系统：结合地区考纲与 AI 教练，讲解/测验/复盘闭环，让学习更高效',
  openGraph: {
    title: '天·才自学系统',
    description: '结合地区考纲与 AI 教练，讲解/测验/复盘闭环',
    url: 'http://localhost:3003/',
    siteName: '天·才自学系统',
    images: [
      { url: '/intelligent.jpg', width: 1200, height: 630, alt: '天·才自学系统' }
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
    <html lang="zh-CN">
      {/* 使用系统字体，避免构建时联网下载 Google Fonts 导致 ECONNRESET */}
      <body className="min-h-screen bg-slate-50 font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          '@context':'https://schema.org', '@type':'WebSite', name:'天·才自学系统', url:'http://localhost:3003/',
        })}} />
        <header className="sticky top-0 z-40 bg-white/90 border-b border-slate-200 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="h-9 px-3 whitespace-nowrap rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">天·才</Link>
              <div>
                <div className="text-lg font-semibold">自学系统</div>
                <div className="text-xs text-slate-500">记录 · 知识库 · 对话</div>
              </div>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="px-3 py-2 rounded hover:bg-slate-100">主页</Link>
              <Link href="/learning-setup" className="px-3 py-2 rounded hover:bg-slate-100">系统学习</Link>
              <Link href="/notes" className="px-3 py-2 rounded hover:bg-slate-100">记录所思</Link>
              <Link href="/unified-chat" className="px-3 py-2 rounded hover:bg-slate-100">统一会话</Link>
              <Link href="/learning-history" className="px-3 py-2 rounded hover:bg-slate-100">自学历史</Link>
              <Link href="/knowledge-base" className="px-3 py-2 rounded hover:bg-slate-100">知识库</Link>
              <Link href="/wrong-book" className="px-3 py-2 rounded hover:bg-slate-100">错题本</Link>
            </nav>
            <div className="flex items-center gap-2">
              <ReviewNavBadge />
              <WrongQuestionNavBadge />
            </div>
          </div>
        </header>

        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: 'rgb(var(--foreground-rgb))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
              border: '1px solid var(--color-primary-light)',
            },
            success: { iconTheme: { primary: 'var(--color-primary)', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
