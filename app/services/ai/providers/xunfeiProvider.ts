import { AIProvider, ChatMessage, XunfeiProviderConfig } from '../types'
import { XunfeiApiService } from '../../xunfeiApi'

export class XunfeiProvider implements AIProvider {
  private svc: XunfeiApiService

  constructor(cfg: XunfeiProviderConfig) {
    this.svc = new XunfeiApiService({
      appId: cfg.appId,
      apiKey: cfg.apiKey,
      apiSecret: cfg.apiSecret,
      domain: cfg.domain,
      apiUrl: cfg.apiUrl,
    })
  }

  onMessage(handler: (message: string, isFinal: boolean) => void): void {
    this.svc.onMessage(handler)
  }

  onError(handler: (error: string) => void): void {
    this.svc.onError(handler)
  }

  async sendMessage(query: string, history?: ChatMessage[]): Promise<void> {
    // 复用原有服务的消息结构
    await this.svc.sendMessage(query, history as any)
  }

  close(): void {
    this.svc.close()
  }

  setDebugMode(debug: boolean): void {
    this.svc.setDebugMode?.(debug)
  }
}