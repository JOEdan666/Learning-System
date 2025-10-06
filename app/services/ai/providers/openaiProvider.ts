import { AIProvider, ChatMessage } from '../types'

export class OpenAIProvider implements AIProvider {
  private messageHandler: ((message: string, isFinal: boolean) => void) | null = null
  private errorHandler: ((error: string) => void) | null = null
  // 非流式，客户端不持有长连接

  onMessage(handler: (message: string, isFinal: boolean) => void): void {
    this.messageHandler = handler
  }

  onError(handler: (error: string) => void): void {
    this.errorHandler = handler
  }

  async sendMessage(query: string, history?: ChatMessage[]): Promise<void> {
    try {
      console.log('[OpenAIProvider] 发送消息:', query);
      console.log('[OpenAIProvider] 历史消息:', history);
      
      // 创建fetch选项 - 使用API期望的格式
      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query,
          history: history || []
        }),
      };
      
      console.log('[OpenAIProvider] 发送请求到:', '/api/openai-chat?stream=1');
      console.log('[OpenAIProvider] 请求选项:', fetchOptions);
      
      const resp = await fetch('/api/openai-chat?stream=1', fetchOptions);

      console.log('[OpenAIProvider] 收到响应状态:', resp.status);
      
      if (!resp.ok) {
        const status = resp.status
        let parsed: any = null
        let rawText = ''
        try {
          parsed = await resp.json()
        } catch (e) {
          console.error('[OpenAIProvider] 解析错误响应JSON失败:', e);
          rawText = await resp.text().catch(() => '')
        }
        const upstreamMsg: string = parsed?.error || rawText || `请求失败: ${status}`
        console.error('[OpenAIProvider] 请求失败:', status, upstreamMsg);

        let friendly = upstreamMsg
        switch (status) {
          case 401:
            friendly = `鉴权失败（401）。请检查 OPENAI_API_KEY 是否正确且具备相应权限。详情：${upstreamMsg}`
            break
          case 402:
            friendly = `余额不足（402）。请为当前账户充值，或切换到讯飞提供商（设置 NEXT_PUBLIC_AI_PROVIDER=xunfei 并重启）。详情：${upstreamMsg}`
            break
          case 403:
            friendly = `无权限（403）。请确认账号已开通对应模型与接口权限。详情：${upstreamMsg}`
            break
          case 404:
            friendly = `未找到接口或模型（404）。请核对 OPENAI_BASE_URL 与 OPENAI_MODEL。详情：${upstreamMsg}`
            break
          case 429:
            friendly = `超出速率/配额限制（429）。请稍后重试或提升配额。详情：${upstreamMsg}`
            break
          default:
            if (status >= 500) {
              friendly = `上游服务异常（${status}）。请稍后再试。详情：${upstreamMsg}`
            }
        }

        this.errorHandler?.(friendly)
        return
      }

      // 如果返回的是 JSON（非流式回退），保持一次性返回
      const ct = resp.headers.get('content-type') || ''
      console.log('[OpenAIProvider] 响应内容类型:', ct);
      
      if (ct.includes('application/json')) {
        const data = await resp.json()
        const content = data?.content || ''
        console.log('[OpenAIProvider] 非流式响应内容:', content);
        this.messageHandler?.(content, true)
        return
      }

      // 流式读取纯文本增量内容
      const reader = resp.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      if (!reader) {
        this.errorHandler?.('浏览器不支持流式读取响应')
        return
      }
      
      console.log('[OpenAIProvider] 开始读取流式响应');
      let done = false
      let totalContent = ''
      let receivedChunks = 0
      
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        
        if (value) {
          try {
            const chunk = decoder.decode(value, { stream: true })
            receivedChunks++
            
            // 添加调试信息，记录每个数据块
            console.log(`[OpenAIProvider] 收到数据块 #${receivedChunks}:`, chunk);
            
            totalContent += chunk
            
            // 确保messageHandler存在且不为空字符串
            if (this.messageHandler && chunk.trim() !== '') {
              console.log(`[OpenAIProvider] 调用messageHandler，内容长度: ${chunk.length}`);
              this.messageHandler(chunk, false)
            }
          } catch (decodeError) {
            console.error('[OpenAIProvider] 解码数据块失败:', decodeError);
          }
        }
      }
      
      console.log('[OpenAIProvider] 流式响应完成，总内容:', totalContent);
      console.log('[OpenAIProvider] 总共接收数据块数量:', receivedChunks);
      
      // 发送最终消息（即使是空的）
      if (this.messageHandler) {
        this.messageHandler('', true)
      }
    } catch (e: any) {
      console.error('[OpenAIProvider] 发生错误:', e);
      this.errorHandler?.(e?.message || '网络错误')
    }
  }

  close(): void {
    // 无需关闭
  }
}