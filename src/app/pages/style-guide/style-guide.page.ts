import { ChangeDetectionStrategy, Component } from '@angular/core';

import { StyleGuideViewComponent } from '../../features/style-guide/components/style-guide-view/style-guide-view.component';

@Component({
  selector: 'app-style-guide-page',
  imports: [StyleGuideViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './style-guide.page.html',
})
export class StyleGuidePageComponent {}
