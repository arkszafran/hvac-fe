import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-map-pin-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map-pin-icon.component.html',
  host: {
    'aria-hidden': 'true',
    class: 'inline-flex shrink-0',
  },
})
export class UiMapPinIconComponent {}
