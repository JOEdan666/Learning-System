/**
 * 请求去重工具
 *
 * 防止相同请求并发执行，确保同一时间只有一个请求在处理
 */

const pendingRequests = new Map<string, Promise<any>>();

/**
 * 去重请求
 *
 * 如果相同的请求正在执行，则返回现有的 Promise
 * 否则执行新请求并缓存 Promise
 *
 * @param key - 请求唯一标识符
 * @param requestFn - 执行请求的函数
 * @returns 请求结果
 *
 * @example
 * ```ts
 * const data = await deduplicateRequest(
 *   `learning-progress-${conversationId}`,
 *   () => fetch(`/api/learning-progress/${conversationId}`)
 * );
 * ```
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // 如果相同的请求正在执行，直接返回现有的 Promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // 执行新请求
  const promise = requestFn().finally(() => {
    // 请求完成后，从缓存中删除
    pendingRequests.delete(key);
  });

  // 缓存 Promise
  pendingRequests.set(key, promise);

  return promise;
}

/**
 * 清除指定请求的缓存
 *
 * @param key - 请求唯一标识符
 */
export function clearRequest(key: string): void {
  pendingRequests.delete(key);
}

/**
 * 清除所有请求缓存
 */
export function clearAllRequests(): void {
  pendingRequests.clear();
}

/**
 * 检查请求是否正在执行
 *
 * @param key - 请求唯一标识符
 * @returns 是否正在执行
 */
export function isRequestPending(key: string): boolean {
  return pendingRequests.has(key);
}

export default {
  deduplicateRequest,
  clearRequest,
  clearAllRequests,
  isRequestPending,
};
