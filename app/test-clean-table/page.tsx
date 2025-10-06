'use client';

import React from 'react';

const CleanTablePage = () => {
  // 表格数据
  const tableData = [
    {
      aspect: '政治',
      background: '甲午战争失败，民族危机加深',
      process: '戊戌变法启动',
      impact: '政治近代化尝试'
    },
    {
      aspect: '经济',
      background: '设立工商局',
      process: '推动近代经济',
      impact: '工业化萌芽'
    },
    {
      aspect: '军事',
      background: '训练新军',
      process: '失败',
      impact: '为辛亥革命奠基'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          整齐表格展示
        </h1>
        
        {/* 表格容器 - 响应式设计 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* 表头 */}
              <thead>
                <tr className="bg-blue-100">
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm md:text-base">
                    方面
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm md:text-base">
                    背景
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm md:text-base">
                    过程
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800 text-sm md:text-base">
                    影响
                  </th>
                </tr>
              </thead>
              
              {/* 表体 */}
              <tbody>
                {tableData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700 text-sm md:text-base font-medium">
                      {row.aspect}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700 text-sm md:text-base leading-relaxed">
                      {row.background}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700 text-sm md:text-base leading-relaxed">
                      {row.process}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700 text-sm md:text-base leading-relaxed">
                      {row.impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 表格特性说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">表格特性</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              使用标准 HTML 表格结构（table、thead、tbody、tr、th、td）
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              表格有完整边框，行列对齐整齐
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              隔行背景色区分，提高可读性
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              表头浅蓝背景，字体加粗
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              内容居中对齐，支持文字换行
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              完全兼容移动端，响应式设计
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              悬停效果增强交互体验
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CleanTablePage;