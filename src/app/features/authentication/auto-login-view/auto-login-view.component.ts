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
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import { AuthService } from '../../../common/authentication';
import { readAuthenticationErrorMessage } from '../utils/authentication-error.util';
import { parseAutoLoginFragment } from '../utils/auto-login-fragment.util';

@Component({
  selector: 'app-auto-login-view',
  imports: [RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auto-login-view.component.html',
})
export class AutoLoginViewComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transloco = inject(TranslocoService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    const credentials = parseAutoLoginFragment(this.document.location.hash);
    this.clearUrlFragment();

    if (credentials === null) {
      this.isLoading.set(false);
      this.errorMessage.set(this.transloco.translate('auth.autoLogin.invalidLink'));
      return;
    }

    this.authService
      .autoLoginWithInitialCredentials(credentials, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true).set(SKIP_GLOBAL_LOADER, true),
      })
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error: unknown) => {
          this.errorMessage.set(
            readAuthenticationErrorMessage(
              error,
              this.transloco.translate('auth.autoLogin.errors.failed'),
            ),
          );
        },
      });
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
