import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiIconName =
  | 'calendar'
  | 'check-square'
  | 'chevron-right'
  | 'device'
  | 'filter'
  | 'grid'
  | 'help'
  | 'more'
  | 'phone'
  | 'plus'
  | 'search'
  | 'target'
  | 'users';

@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.component.html',
  host: {
    'aria-hidden': 'true',
    class: 'inline-flex shrink-0',
  },
})
export class UiIconComponent {
  readonly name = input.required<UiIconName>();
}
