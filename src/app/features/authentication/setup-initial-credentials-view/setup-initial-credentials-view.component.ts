import { HttpContext } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import { UsersApi, type SetupNewUserCredentialsDto } from '../../../common/api/users';
import { AuthService } from '../../../common/authentication';
import { PinCodeInputComponent } from '../../../common/components';
import { passwordComplexityValidator } from '../../../common/validators';
import { UiButtonComponent, UiInputComponent } from '../../../ui';
import { readAuthenticationErrorMessage } from '../utils/authentication-error.util';

type SetupStep = 'password' | 'pin' | 'pin-confirmation';

const PIN_LENGTH = 4;

@Component({
  selector: 'app-setup-initial-credentials-view',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PinCodeInputComponent,
    UiButtonComponent,
    UiInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup-initial-credentials-view.component.html',
})
export class SetupInitialCredentialsViewComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersApi = inject(UsersApi);

  protected readonly currentStep = signal<SetupStep>('password');
  protected readonly passwordStepSubmitted = signal(false);
  protected readonly pin = signal('');
  protected readonly confirmedPin = signal('');
  protected readonly pinError = signal('');
  protected readonly serverError = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly currentPassword = this.authService.currentInitialCredentialsPassword;
  protected readonly stepNumber = computed(() => {
    switch (this.currentStep()) {
      case 'password':
        return 1;
      case 'pin':
        return 2;
      case 'pin-confirmation':
        return 3;
      default:
        return 1;
    }
  });
  protected readonly canSubmitCredentials = computed(
    () => this.confirmedPin().length === PIN_LENGTH && !this.isSubmitting(),
  );

  protected readonly passwordForm = this.formBuilder.nonNullable.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          passwordComplexityValidator(),
          differentThanCurrentPasswordValidator(() => this.currentPassword()),
        ],
      ],
      passwordConfirmation: ['', Validators.required],
    },
    {
      validators: matchingPasswordsValidator(),
    },
  );

  protected submitPasswordStep(): void {
    this.passwordStepSubmitted.set(true);
    this.serverError.set('');

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.currentStep.set('pin');
  }

  protected updatePin(pin: string): void {
    this.pinError.set('');
    this.pin.set(pin);
  }

  protected updateConfirmedPin(pin: string): void {
    this.pinError.set('');
    this.confirmedPin.set(pin);

    if (pin.length === PIN_LENGTH && pin !== this.pin()) {
      this.pinError.set('Podany PIN nie jest zgodny z poprzednim.');
    }
  }

  protected goToPinConfirmationStep(): void {
    this.serverError.set('');

    if (this.pin().length !== PIN_LENGTH) {
      this.pinError.set('Wprowadz 4-cyfrowy PIN.');
      return;
    }

    this.confirmedPin.set('');
    this.pinError.set('');
    this.currentStep.set('pin-confirmation');
  }

  protected goBackToPinStep(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.pinError.set('');
    this.confirmedPin.set('');
    this.currentStep.set('pin');
  }

  protected submitCredentials(): void {
    const currentPassword = this.currentPassword();

    this.serverError.set('');

    if (!currentPassword) {
      this.serverError.set(
        'Nie mozemy zapisac danych logowania. Otworz link aktywacyjny ponownie.',
      );
      return;
    }

    if (this.confirmedPin().length !== PIN_LENGTH || this.confirmedPin() !== this.pin()) {
      this.pinError.set('Podany PIN nie jest zgodny z poprzednim.');
      return;
    }

    if (this.passwordForm.invalid) {
      this.currentStep.set('password');
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.usersApi
      .setupInitialCredentials(this.setupInitialCredentialsDto(currentPassword), {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true).set(SKIP_GLOBAL_LOADER, true),
      })
      .pipe(
        switchMap(() => this.authService.completeInitialCredentialsSetup()),
        finalize(() => {
          this.isSubmitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error: unknown) => {
          this.serverError.set(
            readAuthenticationErrorMessage(
              error,
              'Nie udalo sie zapisac danych logowania. Sprobuj ponownie.',
            ),
          );
        },
      });
  }

  protected passwordError(): string {
    const control = this.passwordForm.controls.password;

    if (!control.invalid || (!this.passwordStepSubmitted() && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Haslo jest wymagane.';
    }

    if (control.hasError('minlength')) {
      return 'Haslo musi miec co najmniej 8 znakow.';
    }

    if (control.hasError('maxlength')) {
      return 'Haslo nie moze byc dluzsze niz 100 znakow.';
    }

    if (control.hasError('passwordComplexity')) {
      return 'Haslo musi zawierac co najmniej jedna duza litere i jedna cyfre.';
    }

    if (control.hasError('sameAsCurrentPassword')) {
      return 'Haslo musi byc inne niz haslo z linku aktywacyjnego.';
    }

    return '';
  }

  protected passwordConfirmationError(): string {
    const control = this.passwordForm.controls.passwordConfirmation;

    if (!control.invalid && !this.passwordForm.hasError('passwordMismatch')) {
      return '';
    }

    if (!this.passwordStepSubmitted() && !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Potwierdzenie hasla jest wymagane.';
    }

    if (this.passwordForm.hasError('passwordMismatch')) {
      return 'Hasla musza byc takie same.';
    }

    return '';
  }

  private setupInitialCredentialsDto(currentPassword: string): SetupNewUserCredentialsDto {
    return {
      currentPassword,
      password: this.passwordForm.controls.password.getRawValue(),
      pin: this.pin(),
    };
  }
}

function differentThanCurrentPasswordValidator(
  readCurrentPassword: () => string | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const currentPassword = readCurrentPassword();
    const value = typeof control.value === 'string' ? control.value : '';

    if (!currentPassword || !value) {
      return null;
    }

    return value === currentPassword ? { sameAsCurrentPassword: true } : null;
  };
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
