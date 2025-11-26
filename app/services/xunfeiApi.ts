// 科大讯飞大模型API服务
export interface XunfeiConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
  domain?: string;   // 默认用 generalv
  apiUrl?: string;   // 默认用 wss://spark-api.xf-yun.com/v1.1/chat
}

export interface MessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class XunfeiApiService {
  private config: Required<Pick<XunfeiConfig, 'appId' | 'apiKey' | 'apiSecret'>> & Pick<XunfeiConfig, 'domain' | 'apiUrl'>;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private messageHandler: ((message: string, isFinal: boolean) => void) | null = null;
  private errorHandler: ((error: string) => void) | null = null;
  private debugMode = false;

  constructor(config: XunfeiConfig) {
    if (!config.appId || !config.apiKey || !config.apiSecret) {
      throw new Error('appId, apiKey, apiSecret 是必需的');
    }
    this.config = {
      appId: config.appId,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      domain: config.domain || 'general',
      apiUrl: config.apiUrl || 'wss://spark-api.xf-yun.com/v1.1/chat'
    };
  }

  setDebugMode(debug: boolean) {
    this.debugMode = debug;
  }

  private debugLog(...args: any[]) {
    if (this.debugMode) console.log('[讯飞API]', ...args);
  }

  onMessage(handler: (message: string, isFinal: boolean) => void) {
    this.messageHandler = handler;
  }

  onError(handler: (error: string) => void) {
    this.errorHandler = handler;
  }

  /** 生成鉴权URL */
  private async buildAuthUrl(): Promise<string> {
    try {
      const apiUrl = this.config.apiUrl || 'wss://spark-api.xf-yun.com/v3.5/chat';
      const url = new URL(apiUrl);
      const host = url.host;
      const path = url.pathname;
      const date = new Date().toUTCString();
      const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

      this.debugLog('构建鉴权URL中...', { host, path });
      
      // 用 API_SECRET 签名
      const signature = await this.hmacSHA256(signatureOrigin, this.config.apiSecret);
      const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
      
      // 修复：确保在浏览器环境中正确使用btoa
      let authorization;
      if (typeof btoa === 'function') {
        authorization = btoa(authorizationOrigin);
      } else if (typeof Buffer !== 'undefined') {
        authorization = Buffer.from(authorizationOrigin).toString('base64');
      } else {
        // 兼容性实现
        const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let i = 0, l = authorizationOrigin.length, output = '';
        while (i < l) {
          const chr1 = authorizationOrigin.charCodeAt(i++);
          const chr2 = i < l ? authorizationOrigin.charCodeAt(i++) : 0;
          const chr3 = i < l ? authorizationOrigin.charCodeAt(i++) : 0;
          const enc1 = chr1 >> 2;
          const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          const enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          const enc4 = chr3 & 63;
          output += b64chars.charAt(enc1) + b64chars.charAt(enc2) +
            (i > l - 2 ? '=' : b64chars.charAt(enc3)) +
            (i > l - 3 ? '=' : b64chars.charAt(enc4));
        }
        authorization = output;
      }

      url.searchParams.append('authorization', authorization);
      url.searchParams.append('date', date);
      url.searchParams.append('host', host);

      this.debugLog('鉴权URL构建成功');
      return url.toString();
    } catch (error) {
      const errorMessage = error instanceof Error ? 
        `构建鉴权URL失败: ${error.message}` : 
        '构建鉴权URL失败: 未知错误';
      this.debugLog(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /** HMAC-SHA256，返回 Base64 字符串（浏览器 / Node 都兼容） */
  private async hmacSHA256(message: string, secret: string): Promise<string> {
    try {
      // 浏览器：Web Crypto
      if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.subtle !== 'undefined') {
        const enc = new TextEncoder();
        const key = await window.crypto.subtle.importKey(
          'raw',
          enc.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sig = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
        // ArrayBuffer -> Base64
        const bytes = new Uint8Array(sig);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        
        // 安全使用btoa
        if (typeof btoa === 'function') {
          return btoa(binary);
        } else if (typeof Buffer !== 'undefined') {
          return Buffer.from(binary).toString('base64');
        } else {
          // 兼容性实现
          const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          let i = 0, l = binary.length, output = '';
          while (i < l) {
            const chr1 = binary.charCodeAt(i++);
            const chr2 = i < l ? binary.charCodeAt(i++) : 0;
            const chr3 = i < l ? binary.charCodeAt(i++) : 0;
            const enc1 = chr1 >> 2;
            const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            const enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            const enc4 = chr3 & 63;
            output += b64chars.charAt(enc1) + b64chars.charAt(enc2) +
              (i > l - 2 ? '=' : b64chars.charAt(enc3)) +
              (i > l - 3 ? '=' : b64chars.charAt(enc4));
          }
          return output;
        }
      }
      
      // 尝试使用Node crypto
      try {
        const crypto = require('crypto');
        return crypto.createHmac('sha256', secret).update(message).digest('base64');
      } catch (e) {
        this.debugLog('Node crypto不可用，使用备用方法');
        throw e; // 让它进入下一个备用方法
      }
    } catch (e) {
      // 最后的备用方法：使用纯JavaScript实现
      this.debugLog('使用纯JavaScript实现HMAC-SHA256');
      throw new Error('HMAC-SHA256计算失败: 当前环境不支持所需的加密API');
    }
  }

  /** 连接到讯飞API */
  connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.isConnected && this.ws) {
        resolve();
        return;
      }

      try {
        // 验证DOMAIN和API_URL的匹配关系
        const domainUrlMap: Record<string, string> = {
          'generalv3.5': 'wss://spark-api.xf-yun.com/v3.5/chat',
          'generalv3': 'wss://spark-api.xf-yun.com/v1.1/chat',
          'general': 'wss://spark-api.xf-yun.com/v1.1/chat',
          'lite': 'wss://spark-api.xf-yun.com/v1.1/chat'
        };
        
        // 检查配置的DOMAIN和API_URL是否匹配
        const domain = this.config.domain || 'generalv3.5';
        const apiUrl = this.config.apiUrl || 'wss://spark-api.xf-yun.com/v3.5/chat';
        if (domainUrlMap[domain] && !apiUrl.includes(domain)) {
          const expectedUrl = domainUrlMap[domain];
          this.debugLog(`⚠️ 警告: 检测到DOMAIN(${domain})和API_URL(${apiUrl})可能不匹配，推荐的URL: ${expectedUrl}`);
        }
        
        const authUrl = await this.buildAuthUrl();
        this.debugLog('尝试建立WebSocket连接...', authUrl);
        this.ws = new WebSocket(authUrl);
          this.ws.onopen = () => {
          this.debugLog('✅ 已连接到讯飞Spark API');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => this.handleMessage(event.data);

        this.ws.onerror = (event) => {
          this.isConnected = false;
          this.debugLog('❌ WebSocket连接错误', event);
          
          // 提供更详细的错误信息
          let errorMessage = 'API连接失败: 网络错误或服务器拒绝连接';
          
          // 检查是否可能是凭证问题
          if (this.config.apiKey === 'ef3053ece3485e6ce1f81dbbc5911421' || 
              this.config.apiSecret === 'ZDM3YTQ4ZDMyMGQ0NDcyN2IyMDY1OTI0') {
            errorMessage += '。请在.env.local文件中配置您自己的科大讯飞API凭证。';
          }
          
          this.errorHandler?.(errorMessage);
          reject(new Error(errorMessage));
        };

        this.ws.onclose = (event) => {
          this.debugLog('🔌 WebSocket连接已关闭', { code: event.code, reason: event.reason });
          
          // 根据关闭代码提供更详细的信息
          let closeMessage = '';
          if (event.code === 1006) {
            closeMessage = 'WebSocket连接被意外关闭，可能是网络问题或服务器拒绝连接。';
          } else if (event.code === 4004) {
            closeMessage = '连接被服务器拒绝，可能是鉴权失败。';
          }
          
          if (closeMessage) {
            this.debugLog(closeMessage);
          }
          
          this.isConnected = false;
        };
      } catch (e) {
        // 处理连接过程中的错误
        const errorMessage = e instanceof Error ? 
          `连接建立失败: ${e.message}` : 
          '连接建立失败: 未知错误';
        this.debugLog(errorMessage, e);
        this.errorHandler?.(errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const res = JSON.parse(data);
      if (res.header.code !== 0) {
        const msg = `API错误: ${res.header.code} - ${res.header.message}`;
        this.errorHandler?.(msg);
        return;
      }
      const content = res.payload.choices.text[0].content;
      const isFinal = res.header.status === 2;
      this.messageHandler?.(content, isFinal);
      if (isFinal) this.close();
    } catch (e) {
      this.errorHandler?.('解析响应失败');
    }
  }

  /** 发消息 */
  async sendMessage(query: string, history?: MessageItem[]) {
    try {
      this.debugLog('准备发送消息...', { query, historyLength: history?.length });
      
      if (!this.isConnected || !this.ws) {
        this.debugLog('需要先建立连接');
        await this.connect();
      }
      
      if (!this.ws || !this.isConnected) {
        const error = new Error('未成功建立WebSocket连接');
        this.debugLog(error.message);
        throw error;
      }
      
      const messages = history || [];
      messages.push({ role: 'user', content: query });

      const data = {
        header: { app_id: this.config.appId, uid: `user_${Date.now()}` },
        parameter: {
          chat: { domain: this.config.domain, temperature: 0.7, max_tokens: 2048 }
        },
        payload: { message: { text: messages } }
      };

      this.debugLog('消息数据已构建，准备发送');
      try {
        this.ws.send(JSON.stringify(data));
        this.debugLog('消息发送成功');
      } catch (sendError) {
        const errorMsg = sendError instanceof Error ? 
          `发送消息失败: ${sendError.message}` : 
          '发送消息失败: 网络错误';
        this.debugLog(errorMsg, sendError);
        this.errorHandler?.(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      // 重新抛出错误，让调用方可以捕获
      this.debugLog('发送消息过程中捕获到错误', error);
      throw error;
    }
  }

  close() {
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }
}

export const createXunfeiApiService = (config: XunfeiConfig) =>
  new XunfeiApiService(config);
