'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Target, Brain, BookOpen, CheckCircle, BarChart } from 'lucide-react'

const steps = [
  { id: 'target', title: '目标设定', icon: Target },
  { id: 'diagnose', title: 'AI 诊断', icon: Brain },
  { id: 'learn', title: '智能导学', icon: BookOpen },
  { id: 'verify', title: '效果检测', icon: CheckCircle },
  { id: 'report', title: '掌握报告', icon: BarChart },
]

export default function NewLearningRoadmap() {
  const activeStepIndex = 0 // For visual purposes, always highlight the first step

  return (
    <div className="w-full mb-12">
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" />
        <div className="grid grid-cols-5 gap-4 relative">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index <= activeStepIndex
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2
                    ${isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`text-sm font-semibold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                  {step.title}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
