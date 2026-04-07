export type AppErrorStatus = 400 | 401 | 403 | 404 | 413;
export type ErrorResponseStatus = AppErrorStatus | 500;

export interface ErrorResponse {
  error: string;
  message?: string;
  status: ErrorResponseStatus;
}

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

export const createErrorResponse = (
  status: ErrorResponseStatus,
  error: string,
  message?: string
): ErrorResponse => ({
  error,
  ...(message === undefined ? {} : { message }),
  status
});

export const toErrorResponse = (error: unknown): ErrorResponse => {
  if (isAppError(error)) {
    return createErrorResponse(error.status, error.message);
  }

  return createErrorResponse(500, "An unexpected error occurred");
};
