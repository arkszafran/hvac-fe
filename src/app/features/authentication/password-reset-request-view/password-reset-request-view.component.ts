import { HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import {
  AuthenticationApi,
  type RequestPasswordResetDto,
} from '../../../common/api/authentication';
import { UiButtonComponent, UiInputComponent } from '../../../ui';
import { readAuthenticationErrorMessage } from '../utils/authentication-error.util';

@Component({
  selector: 'app-password-reset-request-view',
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-reset-request-view.component.html',
})
export class PasswordResetRequestViewComponent {
  private readonly authenticationApi = inject(AuthenticationApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly isSubmitted = signal(false);
  protected readonly serverError = signal('');
  protected readonly submittedEmail = signal('');
  protected readonly submitAttempted = signal(false);

  protected submit(): void {
    if (this.isSubmitting() || this.isSubmitted()) {
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
      .requestPasswordReset(this.requestPasswordResetDto(), {
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
          this.submittedEmail.set(this.form.controls.email.getRawValue());
          this.isSubmitted.set(true);
        },
        error: (error: unknown) => {
          this.serverError.set(
            readAuthenticationErrorMessage(
              error,
              'Nie udalo sie wyslac linku resetowania hasla. Sprobuj ponownie.',
            ),
          );
        },
      });
  }

  protected emailError(): string {
    const control = this.form.controls.email;

    if (!control.invalid || (!this.submitAttempted() && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Adres e-mail jest wymagany.';
    }

    if (control.hasError('email')) {
      return 'Podaj poprawny adres e-mail.';
    }

    return '';
  }

  private requestPasswordResetDto(): RequestPasswordResetDto {
    return {
      email: this.form.controls.email.getRawValue(),
    };
  }
}
