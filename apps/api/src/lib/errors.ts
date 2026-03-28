export type AppErrorStatus = 400 | 401 | 403 | 404;

export class AppError extends Error {
  readonly status: AppErrorStatus;

  constructor(status: AppErrorStatus, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;
