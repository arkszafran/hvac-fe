import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import {
  PaginationResponseDto,
  ServiceOrderListItemDto,
  ServiceOrdersApi,
  ServiceOrdersListResponseDto,
} from '../../../common/api';

interface ScheduledInspectionsRequest {
  query: string;
  page: number;
}

@Injectable()
export class ScheduledInspectionsStore {
  private readonly serviceOrdersApi = inject(ServiceOrdersApi);
  private readonly requestSubject = new Subject<ScheduledInspectionsRequest>();
  private readonly queryState = signal('');
  private readonly pageState = signal(1);
  private readonly inspectionsState = signal<ServiceOrderListItemDto[]>([]);
  private readonly paginationState = signal<PaginationResponseDto | null>(null);
  private readonly hasLoadedState = signal(false);
  private readonly hasErrorState = signal(false);

  readonly inspections = this.inspectionsState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  readonly hasLoaded = this.hasLoadedState.asReadonly();
  readonly hasError = this.hasErrorState.asReadonly();

  constructor() {
    this.requestSubject
      .pipe(
        switchMap((request) =>
          this.serviceOrdersApi
            .listServiceOrders({
              type: 'inspection',
              statuses: ['scheduled'],
              q: request.query,
              page: request.page,
              sortBy: 'scheduledAt',
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
    this.request(this.pageState());
  }

  search(query: string): void {
    this.queryState.set(query);
    this.pageState.set(1);
    this.request(1);
  }

  goToPage(page: number): void {
    const totalPages = this.pagination()?.totalPages ?? 1;
    const nextPage = Math.min(Math.max(1, Math.trunc(page)), Math.max(1, totalPages));

    if (nextPage === this.pageState()) {
      return;
    }

    this.pageState.set(nextPage);
    this.request(nextPage);
  }

  private request(page: number): void {
    this.hasErrorState.set(false);
    this.requestSubject.next({ query: this.queryState(), page });
  }

  private applyResponse(response: ServiceOrdersListResponseDto): void {
    this.hasLoadedState.set(true);
    this.hasErrorState.set(false);
    this.inspectionsState.set(response.data.items);
    this.paginationState.set(response.data.pagination);
    this.pageState.set(response.data.pagination.page);
  }
}
