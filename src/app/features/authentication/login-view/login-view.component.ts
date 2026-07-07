import { HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import type { ApiError } from '../../../common/api/api-error.model';
import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import type { LoginDto } from '../../../common/api/authentication';
import { AuthService } from '../../../common/authentication';
import { ToastService, UiButtonComponent, UiInputComponent } from '../../../ui';

type LoginFormField = 'email' | 'password';

@Component({
  selector: 'app-login-view',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, UiButtonComponent, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-view.component.html',
})
export class LoginViewComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal('');
  protected readonly submitAttempted = signal(false);

  protected submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.submitAttempted.set(true);
    this.serverError.set('');
    this.form.controls.email.setValue(this.form.controls.email.getRawValue().trim());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.loginDto(), {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true).set(SKIP_GLOBAL_LOADER, true),
      })
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.success(this.transloco.translate('auth.login.toast.success'));
        },
        error: (error: unknown) => {
          this.serverError.set(readLoginErrorMessage(error, this.transloco));
        },
      });
  }

  protected validationError(field: LoginFormField): string {
    const control = this.form.controls[field];

    if (!control.invalid || (!this.submitAttempted() && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      return this.transloco.translate(
        field === 'email' ? 'auth.validation.emailRequired' : 'auth.validation.passwordRequired',
      );
    }

    if (field === 'email' && control.hasError('email')) {
      return this.transloco.translate('auth.validation.emailInvalid');
    }

    return '';
  }

  private loginDto(): LoginDto {
    return {
      email: this.form.controls.email.getRawValue(),
      password: this.form.controls.password.getRawValue(),
    };
  }
}

function readLoginErrorMessage(error: unknown, transloco: TranslocoService): string {
  if (!isApiError(error)) {
    return transloco.translate('auth.login.errors.genericRetry');
  }

  const messageByCode = readLoginErrorMessageByCode(error.code, transloco);

  if (messageByCode !== null) {
    return messageByCode;
  }

  if (error.status === 0) {
    return transloco.translate('auth.errors.network');
  }

  if (error.status === 401) {
    return transloco.translate('auth.login.errors.invalidCredentials');
  }

  if (error.status >= 500) {
    return transloco.translate('auth.errors.server');
  }

  return transloco.translate('auth.login.errors.checkCredentials');
}

function readLoginErrorMessageByCode(
  code: string,
  transloco: TranslocoService,
): string | null {
  switch (code) {
    case 'BAD_REQUEST':
    case 'VALIDATION_ERROR':
      return transloco.translate('auth.login.errors.validation');
    case 'INVALID_CREDENTIALS':
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'LOGIN_FAILED':
    case 'UNAUTHORIZED':
    case 'USER_NOT_FOUND':
    case 'WRONG_PASSWORD':
      return transloco.translate('auth.login.errors.invalidCredentials');
    case 'LOGIN_RETRIES_LIMIT_REACHED':
    case 'ACCOUNT_BLOCKED':
      return transloco.translate('auth.login.errors.accountBlocked');
    case 'NETWORK_ERROR':
      return transloco.translate('auth.errors.network');
    case 'SERVER_ERROR':
      return transloco.translate('auth.errors.server');
    default:
      return null;
  }
}

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybeApiError = error as Partial<ApiError>;

  return (
    typeof maybeApiError.status === 'number' &&
    typeof maybeApiError.code === 'string' &&
    typeof maybeApiError.message === 'string'
  );
}
