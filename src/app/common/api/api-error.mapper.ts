import { HttpErrorResponse } from '@angular/common/http';

import { ApiError, ApiErrorBody } from './api-error.model';

export function mapApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: '',
      messageKey: 'api.errors.unknown',
      raw: error,
    };
  }

  const backendError = readBackendError(error.error);

  return {
    status: error.status,
    code: backendError?.code ?? fallbackCode(error.status),
    message: backendError?.message ?? '',
    messageKey: backendError ? undefined : fallbackMessageKey(error),
    details: backendError?.details,
    url: error.url ?? undefined,
    raw: error.error,
  };
}

function isApiError(error: unknown): error is ApiError {
  if (!isRecord(error)) {
    return false;
  }

  return (
    typeof error['status'] === 'number' &&
    typeof error['code'] === 'string' &&
    typeof error['message'] === 'string'
  );
}

function readBackendError(body: unknown): ApiErrorBody['error'] | null {
  if (!isRecord(body)) {
    return null;
  }

  const error = body['error'];

  if (!isRecord(error)) {
    return null;
  }

  const code = error['code'];
  const message = error['message'];

  if (typeof code !== 'string' || typeof message !== 'string') {
    return null;
  }

  return {
    code,
    message,
    details: error['details'],
  };
}

function fallbackCode(status: number): string {
  switch (status) {
    case 0:
      return 'NETWORK_ERROR';
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 423:
      return 'LOCKED';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR';
  }
}

function fallbackMessageKey(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'api.errors.network';
  }

  if (error.status === 401) {
    return 'api.errors.unauthorized';
  }

  if (error.status === 403) {
    return 'api.errors.forbidden';
  }

  if (error.status === 404) {
    return 'api.errors.notFound';
  }

  if (error.status === 409) {
    return 'api.errors.conflict';
  }

  if (error.status === 422) {
    return 'api.errors.validation';
  }

  if (error.status >= 500) {
    return 'api.errors.server';
  }

  return error.message ? 'api.errors.requestWithMessage' : 'api.errors.request';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
