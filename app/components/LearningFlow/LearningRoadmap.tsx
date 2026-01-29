'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Target, Brain, BookOpen, CheckCircle, BarChart } from 'lucide-react'

export default function LearningRoadmap() {
  const steps = [
    {
      id: 'target',
      title: '目标设定',
      desc: '选择学科与主题',
      icon: Target,
      color: 'bg-blue-500',
      active: true
    },
    {
      id: 'diagnose',
      title: 'AI 诊断',
      desc: '精准定位薄弱点',
      icon: Brain,
      color: 'bg-indigo-500',
      active: false
    },
    {
      id: 'learn',
      title: '智能导学',
      desc: '个性化讲解与微课',
      icon: BookOpen,
      color: 'bg-violet-500',
      active: false
    },
    {
      id: 'verify',
      title: '效果检测',
      desc: '变式题确认掌握',
      icon: CheckCircle,
      color: 'bg-purple-500',
      active: false
    },
    {
      id: 'report',
      title: '掌握报告',
      desc: '生成学习分析报告',
      icon: BarChart,
      color: 'bg-fuchsia-500',
      active: false
    }
  ]

  return (
    <div className="w-full mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">系统化学习路径</h3>
        
        <div className="relative">
          {/* 连接线 */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-100 -z-10" />
          
          <div className="grid grid-cols-5 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="relative flex flex-col items-center group">
                  {/* 连接线进度 (仅显示在激活步骤之前) */}
                  {index < steps.length - 1 && step.active && (
                    <div className="absolute top-6 left-1/2 w-full h-0.5 bg-blue-100 -z-10" />
                  )}
                  
                  {/* 图标圆圈 */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm border-4 border-white
                      ${step.active 
                        ? `${step.color} text-white ring-4 ring-blue-50` 
                        : 'bg-slate-100 text-slate-400'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  
                  {/* 文字说明 */}
                  <div className="text-center">
                    <div className={`text-sm font-bold mb-1 ${step.active ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-[10px] text-slate-500 hidden md:block px-2">
                      {step.desc}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
