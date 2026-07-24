import { TestBed } from '@angular/core/testing';

import { UiMultiselectComponent } from './multiselect.component';

describe('UiMultiselectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiMultiselectComponent],
    }).compileComponents();
  });

  it('keeps the dropdown open while selecting multiple options', () => {
    const fixture = TestBed.createComponent(UiMultiselectComponent);
    const selectedValues: string[][] = [];

    fixture.componentRef.setInput('placeholder', 'Select statuses');
    fixture.componentRef.setInput('options', [
      { value: 'contact_required', label: 'Contact required' },
      { value: 'scheduled', label: 'Scheduled' },
    ]);
    fixture.componentInstance.registerOnChange((value) => selectedValues.push(value));
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const checkboxes = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]',
    ) as NodeListOf<HTMLInputElement>;
    checkboxes[0].click();
    checkboxes[1].click();
    fixture.detectChanges();

    expect(selectedValues).toEqual([['contact_required'], ['contact_required', 'scheduled']]);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.textContent).toContain('Contact required, Scheduled');
  });

  it('displays the configured label when every option is selected', () => {
    const fixture = TestBed.createComponent(UiMultiselectComponent);

    fixture.componentRef.setInput('allSelectedLabel', 'All types');
    fixture.componentRef.setInput('options', [
      { value: 'installation', label: 'Installation' },
      { value: 'repair', label: 'Repair' },
    ]);
    fixture.componentInstance.writeValue(['installation', 'repair']);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(trigger.textContent).toContain('All types');
  });
});
