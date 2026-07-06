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

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER } from '../../../common/api/api-context.tokens';
import { AuthenticationApi, type UnlockAccountDto } from '../../../common/api/authentication';
import { ToastService } from '../../../ui';
import {
  parseAuthenticationActionFragment,
  type AuthenticationActionLinkData,
} from '../utils/authentication-action-fragment.util';
import { readAuthenticationErrorMessage } from '../utils/authentication-error.util';

type AccountUnlockState = 'loading' | 'success' | 'invalid' | 'error';

@Component({
  selector: 'app-account-unlock-view',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-unlock-view.component.html',
})
export class AccountUnlockViewComponent implements OnInit {
  private readonly authenticationApi = inject(AuthenticationApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly toast = inject(ToastService);

  protected readonly state = signal<AccountUnlockState>('loading');
  protected readonly serverError = signal('');

  ngOnInit(): void {
    const linkData = parseAuthenticationActionFragment(this.document.location.hash);
    this.clearUrlFragment();

    if (linkData === null) {
      this.state.set('invalid');
      return;
    }

    this.unlockAccount(linkData);
  }

  private unlockAccount(linkData: AuthenticationActionLinkData): void {
    this.state.set('loading');
    this.serverError.set('');

    this.authenticationApi
      .unlockAccount(this.unlockAccountDto(linkData), {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true).set(SKIP_GLOBAL_LOADER, true),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.state.set('success');
          this.toast.success('Konto zostalo odblokowane. Mozesz sie zalogowac.');
        },
        error: (error: unknown) => {
          this.state.set('error');
          this.serverError.set(
            readAuthenticationErrorMessage(
              error,
              'Nie udalo sie odblokowac konta. Popros o nowy link i sprobuj ponownie.',
            ),
          );
        },
      });
  }

  private unlockAccountDto(linkData: AuthenticationActionLinkData): UnlockAccountDto {
    return {
      code: linkData.code,
      userId: linkData.userId,
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
