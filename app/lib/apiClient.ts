/**
 * 统一的 HTTP 客户端
 *
 * 提供带超时、重试、错误处理的 fetch 封装
 */

export interface FetchOptions extends RequestInit {
  /**
   * 请求超时时间（毫秒）
   * @default 30000
   */
  timeout?: number;

  /**
   * 失败重试次数
   * @default 3
   */
  retry?: number;

  /**
   * 重试间隔（毫秒）
   * @default 1000
   */
  retryDelay?: number;
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * 带超时和重试的 fetch 封装
 *
 * @example
 * ```ts
 * const response = await fetchWithTimeout('/api/data', {
 *   timeout: 5000,
 *   retry: 2,
 *   method: 'POST',
 *   body: JSON.stringify({ data })
 * });
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 30000,
    retry = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 如果响应不成功且还有重试次数，继续重试
      if (!response.ok && attempt < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = new TimeoutError(timeout);
        } else {
          lastError = error;
        }
      } else {
        lastError = new Error(String(error));
      }

      // 如果还有重试次数，等待后继续
      if (attempt < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  // 所有重试都失败，抛出最后一个错误
  throw lastError || new Error(`Failed to fetch ${url}`);
}

/**
 * GET 请求的快捷方法
 */
export async function get<T = any>(
  url: string,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * POST 请求的快捷方法
 */
export async function post<T = any>(
  url: string,
  data?: any,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * PUT 请求的快捷方法
 */
export async function put<T = any>(
  url: string,
  data?: any,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * DELETE 请求的快捷方法
 */
export async function del<T = any>(
  url: string,
  options?: Omit<FetchOptions, 'method'>
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export default {
  fetchWithTimeout,
  get,
  post,
  put,
  del,
};
