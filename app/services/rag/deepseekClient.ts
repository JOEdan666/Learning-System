// Server-side DeepSeek Client using native fetch
export class DeepSeekClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1';
    this.model = process.env.OPENAI_MODEL || 'deepseek-chat';
    
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY is not set. DeepSeekClient will fail on requests.');
    }
  }

  async generateCompletion(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    jsonMode: boolean = false
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API Request Failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error('Failed to generate completion from DeepSeek');
    }
  }

  // 用于质检的简单接口
  async checkQuality(
    prompt: string,
    context: string
  ): Promise<{ passed: boolean; reason?: string }> {
    const messages = [
      { role: 'system', content: '你是一个严格的教育内容质检员。' },
      { role: 'user', content: `Context:\n${context}\n\nTask: ${prompt}\n\n请只返回 JSON 格式: {"passed": boolean, "reason": string}` }
    ] as const;

    try {
      const result = await this.generateCompletion(messages as any, true);
      const json = JSON.parse(result);
      return {
        passed: json.passed,
        reason: json.reason
      };
    } catch (e) {
      console.error('QC Check Failed:', e);
      // Fallback to fail-safe
      return { passed: false, reason: 'Quality check failed to execute.' };
    }
  }
}

export const deepseek = new DeepSeekClient();
