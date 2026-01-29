'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Target,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface TopicMastery {
  topic: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  masteryRate: number;
  lastPracticed: string | null;
  trend: 'improving' | 'stable' | 'declining';
  weakPoints: string[];
}

interface SubjectMastery {
  subject: string;
  overallMastery: number;
  totalQuestions: number;
  correctAnswers: number;
  topics: TopicMastery[];
}

interface MasteryData {
  stats: {
    totalSubjects: number;
    totalTopics: number;
    totalQuestions: number;
    overallMastery: number;
    weakestTopics: TopicMastery[];
    improvingTopics: number;
    decliningTopics: number;
  };
  subjects: SubjectMastery[];
}

// 获取掌握度对应的颜色
const getMasteryColor = (rate: number) => {
  if (rate >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' };
  if (rate >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100' };
  if (rate >= 40) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-100' };
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' };
};

// 获取掌握度标签
const getMasteryLabel = (rate: number) => {
  if (rate >= 80) return '掌握良好';
  if (rate >= 60) return '基本掌握';
  if (rate >= 40) return '需要加强';
  return '薄弱环节';
};

// 趋势图标
const TrendIcon = ({ trend }: { trend: 'improving' | 'stable' | 'declining' }) => {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

// 圆形进度条组件
const CircularProgress = ({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = getMasteryColor(value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={color.text}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${color.text}`}>{value}%</span>
      </div>
    </div>
  );
};

// 条形进度条
const ProgressBar = ({ value, showLabel = true }: { value: number; showLabel?: boolean }) => {
  const color = getMasteryColor(value);
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color.bg} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && <span className={`text-sm font-medium ${color.text} w-12`}>{value}%</span>}
    </div>
  );
};

export default function KnowledgeMapPage() {
  const [data, setData] = useState<MasteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-mastery?days=${selectedDays}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDays]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">正在分析你的学习数据...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">{error || '暂无数据'}</p>
          <p className="text-slate-500 text-sm">完成更多学习后，这里会显示你的知识掌握图谱</p>
          <Link href="/learning-interface" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            开始学习 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { stats, subjects } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">知识掌握图谱</h1>
                <p className="text-sm text-slate-500">可视化你的学习薄弱点</p>
              </div>
            </div>

            {/* 时间范围选择 */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>最近7天</option>
                <option value={30}>最近30天</option>
                <option value={90}>最近3个月</option>
                <option value={365}>全部</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* 总体掌握度 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center">
            <CircularProgress value={stats.overallMastery} />
            <p className="mt-4 text-slate-600 font-medium">总体掌握度</p>
            <p className="text-sm text-slate-400">{getMasteryLabel(stats.overallMastery)}</p>
          </div>

          {/* 统计数据 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-slate-600">学习概览</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">已学科目</span>
                <span className="font-bold text-slate-800">{stats.totalSubjects} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">知识点</span>
                <span className="font-bold text-slate-800">{stats.totalTopics} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">答题数</span>
                <span className="font-bold text-slate-800">{stats.totalQuestions} 题</span>
              </div>
            </div>
          </div>

          {/* 进步中 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-slate-600">进步中</span>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.improvingTopics}</div>
            <p className="text-sm text-slate-500">个知识点正在提升</p>
          </div>

          {/* 需关注 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-slate-600">需关注</span>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.decliningTopics}</div>
            <p className="text-sm text-slate-500">个知识点需要复习</p>
          </div>
        </div>

        {/* 薄弱知识点警示 */}
        {stats.weakestTopics.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 mb-8 border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-bold text-red-800">薄弱知识点预警</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.weakestTopics.map((topic, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">{topic.topic}</span>
                    <span className={`text-sm font-bold ${getMasteryColor(topic.masteryRate).text}`}>
                      {topic.masteryRate}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-2">{topic.subject}</div>
                  <ProgressBar value={topic.masteryRate} showLabel={false} />
                  <Link
                    href={`/learning-interface?topic=${encodeURIComponent(topic.topic)}&subject=${encodeURIComponent(topic.subject)}`}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    立即突破 <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 各科目详情 */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            分科目知识掌握
          </h2>

          {subjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无学习记录</p>
              <Link href="/learning-interface" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
                开始学习 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.subject} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* 科目标题 */}
                <div
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSubject(expandedSubject === subject.subject ? null : subject.subject)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getMasteryColor(subject.overallMastery).light}`}>
                        <span className={`text-xl font-bold ${getMasteryColor(subject.overallMastery).text}`}>
                          {subject.subject.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{subject.subject}</h3>
                        <p className="text-sm text-slate-500">
                          {subject.topics.length} 个知识点 · {subject.totalQuestions} 道题
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getMasteryColor(subject.overallMastery).text}`}>
                          {subject.overallMastery}%
                        </div>
                        <div className="text-sm text-slate-500">{getMasteryLabel(subject.overallMastery)}</div>
                      </div>
                      <div className={`transform transition-transform ${expandedSubject === subject.subject ? 'rotate-90' : ''}`}>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={subject.overallMastery} />
                  </div>
                </div>

                {/* 展开的知识点列表 */}
                {expandedSubject === subject.subject && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subject.topics.map((topic, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{topic.topic}</span>
                              <TrendIcon trend={topic.trend} />
                            </div>
                            <span className={`text-sm font-bold ${getMasteryColor(topic.masteryRate).text}`}>
                              {topic.masteryRate}%
                            </span>
                          </div>
                          <ProgressBar value={topic.masteryRate} showLabel={false} />
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                              {topic.correctAnswers}/{topic.totalQuestions} 正确
                            </span>
                            {topic.lastPracticed && (
                              <span className="text-slate-400">
                                {new Date(topic.lastPracticed).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {topic.masteryRate < 60 && (
                            <Link
                              href={`/learning-interface?topic=${encodeURIComponent(topic.topic)}&subject=${encodeURIComponent(topic.subject)}`}
                              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                            >
                              加强练习 <ArrowRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
