import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CustomersViewComponent } from '../../features/customers/customers-view.component';

@Component({
  selector: 'app-customers-page',
  imports: [CustomersViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customers.page.html',
})
export class CustomersPageComponent {}
