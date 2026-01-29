'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Brain, Target, Rocket, CheckCircle, TrendingUp, Clock } from 'lucide-react'
import CurrentLearningCard from './Dashboard/CurrentLearningCard'

export default function HeroSection() {
  const features = [
    { icon: Brain, text: 'AI精准诊断', desc: '秒级定位知识薄弱点' },
    { icon: Target, text: '个性化学习', desc: '千人千面学习路径' },
    { icon: TrendingUp, text: '高效提分', desc: '平均提升30%+成绩' }
  ]

  return (
    <section className="relative min-h-[680px] flex items-center overflow-hidden">
      {/* Sky blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-sky-100 to-blue-200" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/40 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Floating particles */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-sky-400/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-indigo-400/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
        {/* 尝试加载当前学习卡片，如果有活跃会话则显示 */}
        <div className="mb-8">
          <CurrentLearningCard />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-gray-900">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-blue-100 mb-6 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">新一代 AI 智能学习系统</span>
            </motion.div>

            {/* Main title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              智学引擎
              <span className="block text-blue-600 mt-2">让学习更高效</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg"
            >
              基于先进AI技术，精准诊断学习薄弱点，
              智能生成个性化学习方案，助力每位学生高效自学。
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Link
                href="#quick-start"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5"
              >
                <Rocket className="w-5 h-5" />
                开启高效提升
              </Link>
              <Link
                href="/unified-chat"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-white/50 backdrop-blur-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-white transition-all hover:shadow-md"
              >
                与老师对话
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-6 text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>覆盖K12全学段</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>适配多版本教材</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>24小时专业助教</span>
              </div>
            </motion.div>
          </div>

          {/* Right - Feature cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main feature card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl shadow-blue-200 p-8 relative z-10 border border-white/50">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-500 mb-4 shadow-lg shadow-blue-200">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">AI 核心能力</h3>
                </div>

                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl hover:from-sky-100 hover:to-blue-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-md shadow-blue-100">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{feature.text}</div>
                        <div className="text-sm text-gray-500">{feature.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">100+</div>
                    <div className="text-xs text-gray-500">知识点</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">9</div>
                    <div className="text-xs text-gray-500">学科覆盖</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">24h</div>
                    <div className="text-xs text-gray-500">在线服务</div>
                  </div>
                </div>
              </div>

              {/* Decorative cards */}
              <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-sky-200/50 to-blue-200/50 rounded-3xl -z-10" />
              <div className="absolute -top-8 -right-8 w-full h-full bg-gradient-to-br from-sky-100/50 to-blue-100/50 rounded-3xl -z-20" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
        </svg>
      </div>
    </section>
  )
}
