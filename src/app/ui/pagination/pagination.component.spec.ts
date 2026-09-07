import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { UiPaginationComponent } from './pagination.component';

describe('UiPaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UiPaginationComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              ui: {
                pagination: {
                  label: 'Pagination',
                  previous: 'Previous page',
                  next: 'Next page',
                  status: 'Page {{page}} of {{totalPages}}',
                },
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
          preloadLangs: true,
        }),
      ],
    }).compileComponents();
  });

  it('shows the current page and emits adjacent page changes', () => {
    const fixture = TestBed.createComponent(UiPaginationComponent);
    const emittedPages: number[] = [];

    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.componentInstance.pageChange.subscribe((page) => emittedPages.push(page));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();

    expect(fixture.nativeElement.textContent).toContain('Page 2 of 4');
    expect(emittedPages).toEqual([1, 3]);
  });

  it('disables navigation beyond the available page range', () => {
    const fixture = TestBed.createComponent(UiPaginationComponent);

    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('totalPages', 1);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});
