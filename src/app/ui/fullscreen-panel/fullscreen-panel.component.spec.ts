import { TestBed } from '@angular/core/testing';

import { UiFullscreenPanelComponent } from './fullscreen-panel.component';

describe('UiFullscreenPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiFullscreenPanelComponent],
    }).compileComponents();
  });

  it('moves focus to the close button and locks background scrolling', () => {
    const fixture = TestBed.createComponent(UiFullscreenPanelComponent);

    fixture.componentRef.setInput('title', 'Service order details');
    fixture.componentRef.setInput('closeLabel', 'Back to service orders');
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('button[aria-label]') as HTMLElement;

    expect(document.activeElement).toBe(closeButton);
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
  });

  it('requests closing when Escape is pressed', () => {
    const fixture = TestBed.createComponent(UiFullscreenPanelComponent);
    let closeRequestCount = 0;

    fixture.componentRef.setInput('title', 'Service order details');
    fixture.componentRef.setInput('closeLabel', 'Back to service orders');
    fixture.componentInstance.close.subscribe(() => {
      closeRequestCount += 1;
    });
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closeRequestCount).toBe(1);

    fixture.destroy();
  });
});
