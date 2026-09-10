import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import { CustomersApi, CustomersListResponseDto, PaginationResponseDto } from '../../../common/api';
import { Customer } from '../models/customer.model';
import { matchesCustomerSearch } from '../utils/customer-search.util';

interface CustomersListRequest {
  query: string;
  page: number;
}

@Injectable({ providedIn: 'root' })
export class CustomersListStore {
  private readonly customersApi = inject(CustomersApi);
  private readonly requestSubject = new Subject<CustomersListRequest>();
  private readonly queryState = signal('');
  private readonly pageState = signal(1);
  private readonly itemsState = signal<Customer[]>([]);
  private readonly filteringModeState = signal<'client' | 'server' | null>(null);
  private readonly paginationState = signal<PaginationResponseDto | null>(null);
  private readonly hasLoadedState = signal(false);
  private readonly hasErrorState = signal(false);

  readonly query = this.queryState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly filteringMode = this.filteringModeState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  readonly hasLoaded = this.hasLoadedState.asReadonly();
  readonly hasError = this.hasErrorState.asReadonly();
  readonly customers = computed(() => {
    const items = this.itemsState();

    return this.filteringMode() === 'client'
      ? items.filter((customer) => matchesCustomerSearch(customer, this.query()))
      : items;
  });

  constructor() {
    this.requestSubject
      .pipe(
        switchMap((request) =>
          this.customersApi
            .listCustomers({
              q: request.query,
              page: request.page,
              sortBy: 'displayName',
              sortDirection: 'asc',
            })
            .pipe(
              catchError(() => {
                this.hasLoadedState.set(true);
                this.hasErrorState.set(true);
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((response) => this.applyResponse(response));
  }

  load(): void {
    this.request(this.page());
  }

  search(query: string): void {
    this.queryState.set(query);
    this.pageState.set(1);

    if (this.filteringMode() === 'client') {
      return;
    }

    this.request(1);
  }

  goToPage(page: number): void {
    const totalPages = this.pagination()?.totalPages ?? 1;
    const nextPage = Math.min(Math.max(1, Math.trunc(page)), Math.max(1, totalPages));

    if (nextPage === this.page()) {
      return;
    }

    this.pageState.set(nextPage);
    this.request(nextPage);
  }

  private request(page: number): void {
    this.hasErrorState.set(false);
    this.requestSubject.next({ query: this.query(), page });
  }

  private applyResponse(response: CustomersListResponseDto): void {
    this.hasLoadedState.set(true);
    this.hasErrorState.set(false);
    this.filteringModeState.set(response.data.filteringMode);
    this.itemsState.set(response.data.items.map((customer) => ({ ...customer, devices: [] })));

    if (response.data.filteringMode === 'server') {
      this.paginationState.set(response.data.pagination);
      this.pageState.set(response.data.pagination.page);
      return;
    }

    this.paginationState.set(null);
    this.pageState.set(1);
  }
}
