export interface ApiError {
  status: number;
  code: string;
  message: string;
  messageKey?: string;
  details?: unknown;
  url?: string;
  raw?: unknown;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
