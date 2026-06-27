import { HttpErrorResponse } from '@angular/common/http';

import { ApiError, ApiErrorBody } from './api-error.model';

export function mapApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: 'Wystapil nieoczekiwany blad.',
      raw: error,
    };
  }

  const backendError = readBackendError(error.error);

  return {
    status: error.status,
    code: backendError?.code ?? fallbackCode(error.status),
    message: backendError?.message ?? fallbackMessage(error),
    details: backendError?.details,
    url: error.url ?? undefined,
    raw: error.error,
  };
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

function fallbackMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Nie udalo sie polaczyc z serwerem.';
  }

  if (error.status === 401) {
    return 'Sesja wygasla albo dane logowania sa nieprawidlowe.';
  }

  if (error.status === 403) {
    return 'Brak uprawnien do wykonania tej operacji.';
  }

  if (error.status === 404) {
    return 'Nie znaleziono zasobu.';
  }

  if (error.status === 409) {
    return 'Te dane konfliktuja z istniejacym zasobem.';
  }

  if (error.status === 422) {
    return 'Dane formularza wymagaja poprawy.';
  }

  if (error.status >= 500) {
    return 'Wystapil blad serwera.';
  }

  return error.message || 'Request zakonczyl sie bledem.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
