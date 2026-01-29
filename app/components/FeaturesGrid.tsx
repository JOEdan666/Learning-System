'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Database,
  History,
  MessageSquare,
  BookOpen,
  Brain,
  BarChart3,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    title: '知识库',
    desc: '上传学习资料，AI智能管理与分析',
    href: '/knowledge-base',
    icon: Database,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    title: '学习历史',
    desc: '复盘记录、错题追踪与知识图谱',
    href: '/learning-history',
    icon: History,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600'
  },
  {
    title: 'AI 对话',
    desc: '与 AI 助教自由对话，答疑解惑',
    href: '/unified-chat',
    icon: MessageSquare,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600'
  },
  {
    title: '学习笔记',
    desc: '智能笔记管理，知识点归纳整理',
    href: '/notes',
    icon: BookOpen,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600'
  }
]

const stats = [
  { icon: Brain, label: '智能诊断', value: 'AI 精准定位薄弱点' },
  { icon: BarChart3, label: '学习分析', value: '可视化进度追踪' }
]

export default function FeaturesGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-4">
            功能模块
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            全方位学习助手
          </h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            多维度功能支持，打造高效学习闭环
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={feature.href}
                className="group block h-full p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {feature.desc}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>进入</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-12 border border-blue-100"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                AI 驱动，让学习更智能
              </h3>
              <p className="text-gray-600 leading-relaxed">
                基于先进的 AI 技术，智学引擎能够精准分析学习状态，
                提供个性化的学习建议和内容推荐。
              </p>
            </div>
            <div className="grid gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-blue-50"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-gray-900 font-semibold">{stat.label}</div>
                    <div className="text-gray-500 text-sm">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
