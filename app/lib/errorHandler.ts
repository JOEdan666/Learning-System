import { message } from 'antd';

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 统一错误处理函数
 *
 * 自动识别错误类型并显示友好的用户提示
 *
 * @example
 * ```ts
 * try {
 *   await saveData();
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    message.error(error.message);
    console.error(`[${error.code}] ${error.message}`);
  } else if (error instanceof Error) {
    message.error('操作失败，请稍后重试');
    console.error(error);
  } else {
    message.error('未知错误');
    console.error(error);
  }
}

/**
 * 异步操作错误包装器
 *
 * 自动捕获并处理异步函数的错误
 *
 * @example
 * ```ts
 * const onClick = catchError(async () => {
 *   await saveData();
 *   message.success('保存成功');
 * });
 * ```
 */
export function catchError<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T> | void> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
    }
  };
}

export default {
  AppError,
  handleError,
  catchError,
};
