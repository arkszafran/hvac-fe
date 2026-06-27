import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

type ApiQueryValue = string | number | boolean;
type ApiQueryParams = Record<string, ApiQueryValue | readonly ApiQueryValue[] | null | undefined>;

export interface ApiRequestOptions {
  context?: HttpContext;
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | ApiQueryParams;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.api.baseUrl.replace(/\/$/, '');

  get<TResponse>(path: string, options?: ApiRequestOptions): Observable<TResponse> {
    return this.http.get<TResponse>(this.createUrl(path), this.createOptions(options));
  }

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    return this.http.post<TResponse>(
      this.createUrl(path),
      body === undefined ? null : body,
      this.createOptions(options),
    );
  }

  patch<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    return this.http.patch<TResponse>(this.createUrl(path), body, this.createOptions(options));
  }

  delete<TResponse>(path: string, options?: ApiRequestOptions): Observable<TResponse> {
    return this.http.delete<TResponse>(this.createUrl(path), this.createOptions(options));
  }

  private createUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${this.baseUrl}${normalizedPath}`;
  }

  private createOptions(options?: ApiRequestOptions): {
    context?: HttpContext;
    headers?: HttpHeaders | Record<string, string | string[]>;
    params?: HttpParams;
    withCredentials: boolean;
  } {
    return {
      context: options?.context,
      headers: options?.headers,
      params: normalizeParams(options?.params),
      withCredentials: environment.api.withCredentials,
    };
  }
}

function normalizeParams(params: ApiRequestOptions['params']): HttpParams | undefined {
  if (!params || params instanceof HttpParams) {
    return params;
  }

  let httpParams = new HttpParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        httpParams = httpParams.append(key, String(item));
      }

      continue;
    }

    httpParams = httpParams.set(key, String(value));
  }

  return httpParams;
}
