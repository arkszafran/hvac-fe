import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: {
            pl: {
              ui: {
                toast: {
                  success: 'Gotowe',
                  error: 'Blad',
                  info: 'Informacja',
                  warning: 'Uwaga',
                },
              },
            },
          },
          translocoConfig: {
            availableLangs: ['pl'],
            defaultLang: 'pl',
          },
          preloadLangs: true,
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
