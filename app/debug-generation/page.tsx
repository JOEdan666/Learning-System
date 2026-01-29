'use client';

import { useState } from 'react';
import { Card, Button, Input, Select, Form, InputNumber, Tag, Spin, message } from 'antd';
import { Sparkles } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

export default function DebugGenerationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form] = Form.useForm();

  const handleGenerate = async (values: any) => {
    setLoading(true);
    setResult(null);
    try {
      // Convert comma-separated string to array
      const kps = values.knowledgePoints.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean);
      
      const payload = {
        ...values,
        knowledgePoints: kps
      };

      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        message.success('生成成功');
      } else {
        message.error('生成失败: ' + data.error);
      }
    } catch (e: any) {
      message.error('请求错误: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Config Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="text-blue-600" />
              出题引擎调试台
            </h1>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{
                subject: 'history',
                region: 'guangdong',
                grade: '8',
                questionType: 'material_analysis',
                difficulty: 0.65,
                bloomLevel: 'analyze',
                knowledgePoints: '洋务运动'
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="地区" name="region">
                  <Select>
                    <Option value="guangdong">广东</Option>
                    <Option value="beijing">北京</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="学科" name="subject">
                  <Select>
                    <Option value="history">历史</Option>
                    <Option value="math">数学</Option>
                  </Select>
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="年级" name="grade">
                  <Select>
                    <Option value="7">七年级</Option>
                    <Option value="8">八年级</Option>
                    <Option value="9">九年级</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="难度 (0-1)" name="difficulty">
                  <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
                </Form.Item>
              </div>

              <Form.Item label="题型" name="questionType">
                <Select>
                  <Option value="material_analysis">材料分析题</Option>
                  <Option value="choice">选择题</Option>
                </Select>
              </Form.Item>

              <Form.Item label="知识点 (逗号分隔)" name="knowledgePoints">
                <Input placeholder="例如: 洋务运动, 李鸿章" />
              </Form.Item>

              <Form.Item label="能力层级" name="bloomLevel">
                <Select>
                  <Option value="understand">理解</Option>
                  <Option value="apply">应用</Option>
                  <Option value="analyze">分析</Option>
                  <Option value="evaluate">评价</Option>
                </Select>
              </Form.Item>

              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                开始生成
              </Button>
            </Form>
          </div>
        </div>

        {/* Right: Result Display */}
        <div className="space-y-6">
          {loading && (
            <div className="h-full flex items-center justify-center min-h-[400px]">
              <Spin size="large" tip="DeepSeek 正在思考中..." />
            </div>
          )}

          {!loading && result && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex gap-2 mb-2">
                  {result.tags?.map((t: string) => <Tag key={t} color="blue">{t}</Tag>)}
                  <Tag color="orange">难度: {result.difficulty_assessed}</Tag>
                </div>
              </div>

              {/* 题干 */}
              <div className="mb-6 text-slate-800 whitespace-pre-wrap font-serif text-lg leading-relaxed bg-slate-50 p-4 rounded-lg">
                {result.stem}
              </div>

              {/* 小问 */}
              <div className="space-y-6">
                {result.questions?.map((q: any, idx: number) => (
                  <div key={idx} className="pl-4 border-l-4 border-blue-200">
                    <div className="font-bold text-slate-700 mb-2">
                      ({idx + 1}) {q.sub_question} <span className="text-slate-400 font-normal">[{q.score}分]</span>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-md text-sm text-green-800 mb-2">
                      <strong>参考答案：</strong>{q.answer}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {q.grading_points?.map((gp: string, i: number) => (
                        <Tag key={i} color="green">{gp}</Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 解析与易错 */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid gap-4">
                <div className="text-sm">
                  <span className="font-bold text-slate-700 block mb-1">【解析】</span>
                  <p className="text-slate-600">{result.analysis}</p>
                </div>
                <div className="text-sm">
                  <span className="font-bold text-amber-600 block mb-1">【易错点警示】</span>
                  <p className="text-amber-700 bg-amber-50 p-2 rounded">{result.pitfalls}</p>
                </div>
              </div>

              {/* Raw JSON Debug */}
              <details className="mt-8">
                <summary className="text-xs text-slate-400 cursor-pointer">查看原始 JSON</summary>
                <pre className="mt-2 text-xs bg-slate-900 text-green-400 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {!loading && !result && (
            <div className="h-full flex flex-col items-center justify-center min-h-[400px] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
              <p>在左侧配置参数，点击生成预览题目</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
