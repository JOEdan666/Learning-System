'use client';

import React, { useState } from 'react';
import RegionalCurriculumSelector from '../components/RegionalCurriculumSelector';

export default function TestCurriculumSelectorPage() {
  const [selectedRegion, setSelectedRegion] = useState('全国');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">地区考纲选择器测试</h1>
          <p className="text-lg text-gray-600">测试地区考纲选择器的功能和交互</p>
        </div>

        {/* 考纲选择器 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">考纲选择器</h2>
          <RegionalCurriculumSelector
            selectedRegion={selectedRegion}
            selectedCurriculum={selectedCurriculum}
            onCurriculumSelect={(region, curriculum) => {
              setSelectedRegion(region);
              setSelectedCurriculum(curriculum);
              addTestResult(`选择了考纲: ${region} - ${curriculum}`);
            }}
            onRegionChange={(region) => {
              setSelectedRegion(region);
              addTestResult(`地区改变为: ${region}`);
            }}
            onCurriculumChange={(curriculum) => {
              setSelectedCurriculum(curriculum);
              addTestResult(`考纲改变为: ${curriculum}`);
            }}
            subject="数学"
            grade="九年级"
          />
        </div>

        {/* 当前选择状态 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">当前选择状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">选择的地区</h3>
              <p className="text-blue-600 text-xl font-semibold">{selectedRegion || '未选择'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-purple-800 mb-2">选择的考纲</h3>
              <p className="text-purple-600 text-xl font-semibold">{selectedCurriculum || '未选择'}</p>
            </div>
          </div>
        </div>

        {/* 测试结果日志 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">测试结果日志</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">暂无测试结果</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm text-gray-700 font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setTestResults([])}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            清空日志
          </button>
        </div>

        {/* 功能说明 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">功能说明</h2>
          <div className="space-y-4 text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">1</div>
              <div>
                <h3 className="font-semibold text-gray-800">地区选择</h3>
                <p>支持选择全国、北京、上海、广东、江苏、浙江等地区</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">2</div>
              <div>
                <h3 className="font-semibold text-gray-800">考纲选择</h3>
                <p>根据选择的地区显示对应的考纲版本（中考、高考等）</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">3</div>
              <div>
                <h3 className="font-semibold text-gray-800">回调函数</h3>
                <p>选择变化时会触发相应的回调函数，用于更新AI讲解内容</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}