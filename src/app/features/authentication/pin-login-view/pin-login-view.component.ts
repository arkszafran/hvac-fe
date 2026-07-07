import { HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import type { PinLoginDto } from '../../../common/api/authentication';
import { AuthService } from '../../../common/authentication';
import { PinCodeInputComponent } from '../../../common/components';
import { readAuthenticationErrorMessage } from '../utils/authentication-error.util';

@Component({
  selector: 'app-pin-login-view',
  imports: [TranslocoPipe, PinCodeInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pin-login-view.component.html',
})
export class PinLoginViewComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transloco = inject(TranslocoService);

  protected readonly pin = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal('');

  protected updatePin(pin: string): void {
    this.serverError.set('');
    this.pin.set(pin);
  }

  protected submitPin(pin: string): void {
    this.isSubmitting.set(true);

    this.authService
      .pinLogin(this.pinLoginDto(pin), {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true).set(SKIP_GLOBAL_LOADER, true),
      })
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error: unknown) => {
          this.pin.set('');
          this.serverError.set(
            readAuthenticationErrorMessage(
              error,
              this.transloco.translate('auth.pinLogin.errors.failed'),
            ),
          );
        },
      });
  }

  private pinLoginDto(pin: string): PinLoginDto {
    return { pin };
  }
}
