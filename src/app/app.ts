import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { UiAppLoaderHostComponent, UiToastHostComponent } from './ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UiAppLoaderHostComponent, UiToastHostComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
