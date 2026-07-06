import { HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ApiError } from '../../../common/api/api-error.model';
import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import type { LoginDto } from '../../../common/api/authentication';
import { AuthService } from '../../../common/authentication';
import { ToastService, UiButtonComponent, UiInputComponent } from '../../../ui';

type LoginFormField = 'email' | 'password';

@Component({
  selector: 'app-login-view',
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-view.component.html',
})
export class LoginViewComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

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
          this.toast.success('Zalogowano pomyslnie.');
        },
        error: (error: unknown) => {
          this.serverError.set(readLoginErrorMessage(error));
        },
      });
  }

  protected validationError(field: LoginFormField): string {
    const control = this.form.controls[field];

    if (!control.invalid || (!this.submitAttempted() && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      return field === 'email' ? 'Adres e-mail jest wymagany.' : 'Haslo jest wymagane.';
    }

    if (field === 'email' && control.hasError('email')) {
      return 'Podaj poprawny adres e-mail.';
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

function readLoginErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Nie udalo sie zalogowac. Sprobuj ponownie.';
  }

  const messageByCode = readLoginErrorMessageByCode(error.code);

  if (messageByCode !== null) {
    return messageByCode;
  }

  if (error.status === 0) {
    return 'Nie udalo sie polaczyc z serwerem.';
  }

  if (error.status === 401) {
    return 'Nieprawidlowy adres e-mail lub haslo.';
  }

  if (error.status >= 500) {
    return 'Wystapil blad serwera. Sprobuj ponownie za chwile.';
  }

  return 'Nie udalo sie zalogowac. Sprawdz dane i sprobuj ponownie.';
}

function readLoginErrorMessageByCode(code: string): string | null {
  switch (code) {
    case 'BAD_REQUEST':
    case 'VALIDATION_ERROR':
      return 'Dane logowania wymagaja poprawy.';
    case 'INVALID_CREDENTIALS':
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'LOGIN_FAILED':
    case 'UNAUTHORIZED':
    case 'USER_NOT_FOUND':
    case 'WRONG_PASSWORD':
      return 'Nieprawidlowy adres e-mail lub haslo.';
    case 'LOGIN_RETRIES_LIMIT_REACHED':
    case 'ACCOUNT_BLOCKED':
      return 'Konto zostalo zablokowane. Instrukcje odblokowania wyslalismy na adres e-mail.';
    case 'NETWORK_ERROR':
      return 'Nie udalo sie polaczyc z serwerem.';
    case 'SERVER_ERROR':
      return 'Wystapil blad serwera. Sprobuj ponownie za chwile.';
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
