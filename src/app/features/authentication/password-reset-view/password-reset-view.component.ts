import { DOCUMENT } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import {
  AuthenticationApi,
  type ResetPasswordDto,
} from '../../../common/api/authentication';
import { passwordComplexityValidator } from '../../../common/validators';
import { ToastService, UiButtonComponent, UiInputComponent } from '../../../ui';
import { readAuthenticationErrorMessage } from '../utils/authentication-error.util';
import {
  parsePasswordResetFragment,
  type PasswordResetLinkData,
} from '../utils/password-reset-fragment.util';

@Component({
  selector: 'app-password-reset-view',
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-reset-view.component.html',
})
export class PasswordResetViewComponent implements OnInit {
  private readonly authenticationApi = inject(AuthenticationApi);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), passwordComplexityValidator()]],
      passwordConfirmation: ['', Validators.required],
    },
    {
      validators: matchingPasswordsValidator(),
    },
  );
  protected readonly isSubmitting = signal(false);
  protected readonly linkData = signal<PasswordResetLinkData | null>(null);
  protected readonly serverError = signal('');
  protected readonly submitAttempted = signal(false);

  ngOnInit(): void {
    this.linkData.set(parsePasswordResetFragment(this.document.location.hash));
    this.clearUrlFragment();
  }

  protected submit(): void {
    const linkData = this.linkData();

    if (this.isSubmitting() || linkData === null) {
      return;
    }

    this.submitAttempted.set(true);
    this.serverError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authenticationApi
      .resetPassword(this.resetPasswordDto(linkData), {
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
          this.toast.success('Haslo zostalo zmienione. Mozesz sie zalogowac.');
          void this.router.navigateByUrl('/login');
        },
        error: (error: unknown) => {
          this.serverError.set(
            readAuthenticationErrorMessage(
              error,
              'Nie udalo sie zmienic hasla. Popros o nowy link i sprobuj ponownie.',
            ),
          );
        },
      });
  }

  protected passwordError(): string {
    const control = this.form.controls.password;

    if (!control.invalid || (!this.submitAttempted() && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Haslo jest wymagane.';
    }

    if (control.hasError('minlength')) {
      return 'Haslo musi miec co najmniej 8 znakow.';
    }

    if (control.hasError('passwordComplexity')) {
      return 'Haslo musi zawierac co najmniej jedna duza litere i jedna cyfre.';
    }

    return '';
  }

  protected passwordConfirmationError(): string {
    const control = this.form.controls.passwordConfirmation;

    if (!control.invalid && !this.form.hasError('passwordMismatch')) {
      return '';
    }

    if (!this.submitAttempted() && !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Potwierdzenie hasla jest wymagane.';
    }

    if (this.form.hasError('passwordMismatch')) {
      return 'Hasla musza byc takie same.';
    }

    return '';
  }

  private resetPasswordDto(linkData: PasswordResetLinkData): ResetPasswordDto {
    return {
      code: linkData.code,
      userId: linkData.userId,
      password: this.form.controls.password.getRawValue(),
    };
  }

  private clearUrlFragment(): void {
    const window = this.document.defaultView;

    if (!window) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      this.document.title,
      `${this.document.location.pathname}${this.document.location.search}`,
    );
  }
}

function matchingPasswordsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const passwordConfirmation = control.get('passwordConfirmation')?.value;

    if (!password || !passwordConfirmation) {
      return null;
    }

    return password === passwordConfirmation ? null : { passwordMismatch: true };
  };
}
