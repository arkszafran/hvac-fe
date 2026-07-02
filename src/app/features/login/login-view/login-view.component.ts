import { HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import type { ApiError } from '../../../common/api/api-error.model';
import { AuthenticationApi, type LoginDto } from '../../../common/api/authentication';
import { ToastService, UiButtonComponent, UiInputComponent } from '../../../ui';

type LoginFormField = 'email' | 'password';

@Component({
  selector: 'app-login-view',
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-view.component.html',
})
export class LoginViewComponent {
  private readonly authenticationApi = inject(AuthenticationApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
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

    this.authenticationApi
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
          this.toast.success('Zalogowano pomyślnie.');
          void this.router.navigateByUrl('/dashboard');
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
      return field === 'email' ? 'Adres e-mail jest wymagany.' : 'Hasło jest wymagane.';
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
  if (isApiError(error)) {
    return error.message;
  }

  return 'Nie udało się zalogować. Spróbuj ponownie.';
}

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return typeof (error as Partial<ApiError>).message === 'string';
}
