import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { UserListItemDto, UsersApi } from '../../../../common/api/users';
import { UiButtonComponent, UiInputComponent, UiModalComponent } from '../../../../ui';
import { ServiceOrderAssignee } from '../../models/service-order.model';

@Component({
  selector: 'app-service-order-assignee-modal',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    UiButtonComponent,
    UiInputComponent,
    UiModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-order-assignee-modal.component.html',
})
export class ServiceOrderAssigneeModalComponent {
  private readonly usersApi = inject(UsersApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = input(false);
  readonly currentAssignee = input<ServiceOrderAssignee | undefined>(undefined);
  readonly close = output<void>();
  readonly assigned = output<UserListItemDto>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly users = signal<UserListItemDto[]>([]);
  protected readonly selectedUserId = signal('');
  protected readonly isLoading = signal(false);
  protected readonly hasLoadingError = signal(false);
  private readonly hasLoaded = signal(false);
  private readonly searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly filteredUsers = computed(() => {
    const query = normalizeValue(this.searchQuery());

    return this.users().filter(
      (user) => !query || normalizeValue(`${user.name} ${user.email}`).includes(query),
    );
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      this.searchControl.reset('');
      this.selectCurrentAssignee();

      if (!this.hasLoaded()) {
        this.loadUsers();
      }
    });
  }

  protected loadUsers(): void {
    this.isLoading.set(true);
    this.hasLoadingError.set(false);

    this.usersApi
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.hasLoaded.set(true);
          this.isLoading.set(false);
          this.selectCurrentAssignee();
        },
        error: () => {
          this.isLoading.set(false);
          this.hasLoadingError.set(true);
        },
      });
  }

  protected selectUser(userId: string): void {
    this.selectedUserId.set(userId);
  }

  protected confirmAssignment(): void {
    const selectedUser = this.users().find((user) => user.id === this.selectedUserId());

    if (selectedUser) {
      this.assigned.emit(selectedUser);
    }
  }

  private selectCurrentAssignee(): void {
    const currentEmail = this.currentAssignee()?.email;
    const selectedUser = this.users().find((user) => user.email === currentEmail);
    this.selectedUserId.set(selectedUser?.id ?? '');
  }
}

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
