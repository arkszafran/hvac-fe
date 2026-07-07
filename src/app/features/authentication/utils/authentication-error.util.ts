import type { ApiError } from '../../../common/api/api-error.model';

export function readAuthenticationErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isApiError(error)) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return typeof (error as Partial<ApiError>).message === 'string';
}
