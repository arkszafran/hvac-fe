import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';

import { AppLoaderService } from '../loader/app-loader.service';
import { ToastService } from '../../ui/toast/toast.service';
import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from './api-context.tokens';
import { mapApiError } from './api-error.mapper';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const loader = inject(AppLoaderService);
  const toast = inject(ToastService);
  const shouldShowLoader = !request.context.get(SKIP_GLOBAL_LOADER);

  if (shouldShowLoader) {
    loader.show();
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      const apiError = mapApiError(error);

      if (!request.context.get(SKIP_ERROR_TOAST)) {
        toast.error(apiError.message);
      }

      return throwError(() => apiError);
    }),
    finalize(() => {
      if (shouldShowLoader) {
        loader.hide();
      }
    }),
  );
};
