'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function HeroSection() {
  const [offset, setOffset] = useState(0)
  const [cursor, setCursor] = useState({ x: 50, y: 50 })
  const [pointerFine, setPointerFine] = useState(true)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [reduceMotion, setReduceMotion] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const fine = window.matchMedia('(pointer: fine)').matches
        setPointerFine(fine)
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        setReduceMotion(prefersReduced)
      } catch {}
    }
    const onScroll = () => {
      if (reduceMotion) return
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        setOffset(window.scrollY)
        rafRef.current = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onMouseMove = (e: React.MouseEvent) => {
    if (reduceMotion) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setCursor({ x, y })
    const nx = (x - 50) / 50
    const ny = (y - 50) / 50
    setTilt({ x: ny * -6, y: nx * 6 })
  }

  return (
    <section className="relative overflow-hidden" onMouseMove={onMouseMove}>
      <div className="absolute inset-0 -z-10" style={{
        background: `radial-gradient(900px circle at ${cursor.x}% ${cursor.y}%, rgba(59,130,246,0.18), transparent 60%), linear-gradient(135deg, rgba(239,246,255,1), rgba(238,242,255,1))`,
        transform: reduceMotion ? undefined : `translateY(${offset * -0.08}px)`
      }} />
      <div className="absolute -top-24 -left-24 w-[36rem] h-[36rem] -z-10 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 opacity-60 blur-3xl" style={{ transform: reduceMotion ? undefined : `translateY(${offset * -0.12}px)` }} />
      <div className="absolute -bottom-24 -right-24 w-[36rem] h-[36rem] -z-10 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 opacity-60 blur-3xl" style={{ transform: reduceMotion ? undefined : `translateY(${offset * -0.04}px)` }} />
      {pointerFine && !reduceMotion && (
        <div className="pointer-events-none absolute inset-0 -z-10" style={{
          background: `radial-gradient(160px circle at ${cursor.x}% ${cursor.y}%, rgba(99,102,241,0.12), transparent 40%)`
        }} />
      )}
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-2 text-3xl md:text-5xl font-bold leading-tight dark:text-white"
            style={{ transform: `translateY(${offset * -0.12}px)` }}
          >
            <>Be a better person!</>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-4 text-slate-600 dark:text-slate-300"
            style={{ transform: `translateY(${offset * -0.08}px)` }}
          >
            结合地区考纲，系统讲解 → 理解确认 → 测验 → 复盘闭环，让每次学习更有把握。
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-3 text-sm text-slate-500 dark:text-slate-400"
            style={{ transform: `translateY(${offset * -0.06}px)` }}
          >
            适合自学、家长陪学与教师备课：输入教材/讲义即可生成测验与复盘，支持分年级、分地区考纲。
          </motion.p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/learning-setup" className="px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">开始系统学习</Link>
            <Link href="/conversations" className="px-5 py-3 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5">体验 AI 对话</Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="px-3 py-1 rounded-full bg-white/60 border border-slate-200 shadow-sm">地区考纲适配</span>
            <span className="px-3 py-1 rounded-full bg-white/60 border border-slate-200 shadow-sm">自动出题&错题集</span>
            <span className="px-3 py-1 rounded-full bg-white/60 border border-slate-200 shadow-sm">间隔复习提醒</span>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">覆盖语数外理化生地政</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow p-6"
          style={{ transform: `translateY(${offset * -0.06}px) perspective(800px) rotateX(${pointerFine ? tilt.x : 0}deg) rotateY(${pointerFine ? tilt.y : 0}deg)` }}
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">学习流程示意</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-slate-800">
              <div className="font-semibold text-blue-700 dark:text-blue-300">讲解</div>
              <div className="text-slate-600 dark:text-slate-300 mt-1">导图+表格+公式</div>
            </div>
            <div className="p-4 rounded-xl bg-green-50 dark:bg-slate-800">
              <div className="font-semibold text-green-700 dark:text-green-300">测验</div>
              <div className="text-slate-600 dark:text-slate-300 mt-1">自动生成题目</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-slate-800">
              <div className="font-semibold text-purple-700 dark:text-purple-300">结果</div>
              <div className="text-slate-600 dark:text-slate-300 mt-1">错误分析与建议</div>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 dark:bg-slate-800">
              <div className="font-semibold text-orange-700 dark:text-orange-300">复盘</div>
              <div className="text-slate-600 dark:text-slate-300 mt-1">错题集与计划</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
