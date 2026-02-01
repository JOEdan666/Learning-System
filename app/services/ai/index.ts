import { AIProvider, AIProviderConfig } from './types'
import { XunfeiProvider } from './providers/xunfeiProvider'
import { OpenAIProvider } from './providers/openaiProvider'

// 从环境变量创建 Provider 配置
export function createProviderFromEnv(): AIProvider | null {
  const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai').toLowerCase()

  if (provider === 'xunfei') {
    const appId = process.env.NEXT_PUBLIC_XUNFEI_APP_ID || ''
    const apiKey = process.env.NEXT_PUBLIC_XUNFEI_API_KEY || ''
    const apiSecret = process.env.NEXT_PUBLIC_XUNFEI_API_SECRET || ''
    const domain = process.env.NEXT_PUBLIC_XUNFEI_DOMAIN || 'generalv3.5'
    const apiUrl = process.env.NEXT_PUBLIC_XUNFEI_API_URL || 'wss://spark-api.xf-yun.com/v1.1/chat'
    if (appId && apiKey && apiSecret) {
      return new XunfeiProvider({ appId, apiKey, apiSecret, domain, apiUrl })
    }
    console.warn('[AI] 讯飞凭证缺失，自动回退到 OpenAI 代理');
  }

  // 默认使用后端代理的 OpenAI/DeepSeek，客户端无需密钥
  return new OpenAIProvider()
}

// 从显式配置创建 Provider（目前仅支持讯飞）
export function createProvider(cfg: AIProviderConfig): AIProvider | null {
  if (cfg.provider === 'xunfei' && cfg.xunfei) {
    return new XunfeiProvider(cfg.xunfei)
  }
  if (cfg.provider === 'openai') {
    return new OpenAIProvider()
  }
  return null
}

export type { AIProvider } from './types'
