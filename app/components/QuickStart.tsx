'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CURRICULUM_DATABASE } from '../data/curriculumDatabase'
import { Zap, ChevronDown, BookOpen, GraduationCap, Calendar, Target, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuickStart() {
  const router = useRouter()
  const [grade, setGrade] = useState('')
  const [semester, setSemester] = useState('')
  const [subject, setSubject] = useState('')
  const [topicId, setTopicId] = useState('')

  const grades = ['四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']
  const semesters = ['上册', '下册']
  const subjects = ['语文', '数学', '物理', '英语', '历史', '化学', '政治', '生物', '地理']

  const availableTopics = useMemo(() => {
    if (!grade || !subject) return []
    const standards = CURRICULUM_DATABASE.filter(c =>
      c.grade.includes(grade) &&
      c.subject.includes(subject) &&
      (!semester || !c.semester || c.semester === semester)
    )
    const allTopics = standards.flatMap(s => s.topics)
    const uniqueTopics = Array.from(new Map(allTopics.map(item => [item.name, item])).values())
    return uniqueTopics
  }, [grade, subject, semester])

  const handleStart = () => {
    if (!grade || !subject) {
      toast.error('请先选择年级和学科')
      return
    }

    const params = new URLSearchParams()
    params.set('grade', grade)
    params.set('subject', subject)
    if (semester) params.set('semester', semester)

    if (topicId) {
      const topic = availableTopics.find(t => t.id === topicId)
      if (topic) {
        params.set('topic', topic.name)
        params.set('topicId', topic.id)
      }
    } else {
      params.set('topic', `${grade}${semester || ''}${subject}综合诊断`)
    }

    router.push(`/learning-interface?${params.toString()}`)
  }

  const SelectField = ({
    icon: Icon,
    label,
    value,
    options,
    onChange,
    placeholder,
    optional = false,
    disabled = false
  }: {
    icon: React.ElementType
    label: string
    value: string
    options: Array<string | { id: string; name: string }>
    onChange: (v: string) => void
    placeholder: string
    optional?: boolean
    disabled?: boolean
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Icon className="w-4 h-4 text-blue-500" />
        {label}
        {optional && <span className="text-gray-400 font-normal">(可选)</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl text-gray-800 font-medium focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer hover:border-blue-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          <option value="">{placeholder}</option>
          {options.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.id
            const label = typeof opt === 'string' ? opt : opt.name
            return <option key={val} value={val}>{label}</option>
          })}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )

  return (
    <section id="quick-start" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            快速开始
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            3步开启智能学习
          </h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            选择年级和学科，AI将为你定制专属学习方案
          </p>
        </motion.div>

        {/* Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 overflow-hidden"
        >
          {/* Steps indicator */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4">
            <div className="flex items-center justify-center gap-8 text-white">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${grade ? 'bg-white text-blue-600' : 'bg-white/30'}`}>1</div>
                <span className="text-sm font-medium hidden sm:inline">选择年级</span>
              </div>
              <div className="w-8 h-0.5 bg-white/30" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${subject ? 'bg-white text-blue-600' : 'bg-white/30'}`}>2</div>
                <span className="text-sm font-medium hidden sm:inline">选择学科</span>
              </div>
              <div className="w-8 h-0.5 bg-white/30" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${grade && subject ? 'bg-white text-blue-600' : 'bg-white/30'}`}>3</div>
                <span className="text-sm font-medium hidden sm:inline">开始学习</span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <SelectField
                icon={GraduationCap}
                label="年级"
                value={grade}
                options={grades}
                onChange={(v) => { setGrade(v); setTopicId('') }}
                placeholder="选择你的年级"
              />

              <SelectField
                icon={Calendar}
                label="学期"
                value={semester}
                options={semesters}
                onChange={(v) => { setSemester(v); setTopicId('') }}
                placeholder="选择学期"
                optional
              />

              <SelectField
                icon={BookOpen}
                label="学科"
                value={subject}
                options={subjects}
                onChange={(v) => { setSubject(v); setTopicId('') }}
                placeholder="选择薄弱学科"
              />

              <SelectField
                icon={Target}
                label="知识点"
                value={topicId}
                options={availableTopics}
                onChange={(v) => setTopicId(v)}
                placeholder={availableTopics.length > 0 ? '选择具体知识点' : (grade && subject ? '暂无数据' : '先选择年级和学科')}
                optional
                disabled={availableTopics.length === 0}
              />
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                onClick={handleStart}
                disabled={!grade || !subject}
                className="inline-flex items-center gap-3 px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-blue-500/25 hover:scale-105 disabled:hover:scale-100"
              >
                <Zap className="w-5 h-5" />
                {topicId ? '针对性突击训练' : '开始AI诊断测验'}
              </button>
              <p className="mt-4 text-sm text-gray-400">
                支持人教版、苏教版、北师大版等主流教材
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
