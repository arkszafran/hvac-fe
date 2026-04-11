import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiButtonComponent } from '../../../ui';
import { Device, getDeviceTypeLabel } from '../models/device.model';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-[1.1rem] border border-border/90 bg-white">
      <div class="hidden xl:block">
        <table class="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th class="border-b border-border/90 px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted first:pl-6">
                Urządzenie
              </th>
              <th class="border-b border-border/90 px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                Terminy
              </th>
              <th class="border-b border-border/90 px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                Miejsce montażu
              </th>
              <th class="border-b border-border/90 px-5 py-4 text-right text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted last:pr-6">
                Akcje
              </th>
            </tr>
          </thead>

          <tbody class="[&_tr:last-child_td]:border-b-0">
            @for (device of devices(); track device.id) {
              <tr class="group/row transition duration-200">
                <td class="border-b border-border/80 px-5 py-4.5 first:pl-6 group-hover/row:bg-primary-soft/18">
                  <div class="flex flex-col gap-1">
                    <p class="text-[10px]/4 font-semibold uppercase tracking-[0.18em] text-primary/70">
                      {{ getDeviceTypeLabel(device.type) }}
                    </p>
                    <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                      {{ device.brand }} {{ device.model }}
                    </p>
                    <p class="text-[13px]/5 text-text-main/76">
                      {{ device.serialNumber ? 'Numer seryjny: ' + device.serialNumber : '--' }}
                    </p>
                  </div>
                </td>

                <td class="border-b border-border/80 px-5 py-4.5 group-hover/row:bg-primary-soft/18">
                  <div class="flex flex-col gap-1">
                    <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                      @if (device.nextInspectionDate) {
                        Następny przegląd: {{ formatDate(device.nextInspectionDate) }}
                      } @else {
                        Brak zaplanowanego przeglądu
                      }
                    </p>
                    <p class="text-[13px]/5 text-text-main/76">
                      Data montażu: {{ formatDate(device.installationDate) }}
                    </p>
                  </div>
                </td>

                <td class="border-b border-border/80 px-5 py-4.5 group-hover/row:bg-primary-soft/18">
                  <div class="flex flex-col gap-1">
                    <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                      {{ device.location || 'Adres klienta' }}
                    </p>
                    <p class="text-[13px]/5 text-text-main/76">
                      {{ deviceAddress(device) }}
                    </p>
                  </div>
                </td>

                <td class="border-b border-border/80 px-5 py-4.5 last:pr-6 group-hover/row:bg-primary-soft/18">
                  <div class="flex justify-end gap-2">
                    <ui-button variant="ghost" size="sm" (pressed)="deviceEditRequested.emit(device)">
                      Edytuj
                    </ui-button>
                    <ui-button variant="ghost" size="sm" (pressed)="deviceSelected.emit(device)">
                      Szczegóły
                    </ui-button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="xl:hidden">
        @for (device of devices(); track device.id) {
          <article class="border-b border-border/80 px-4 py-4 last:border-b-0">
            <div class="space-y-3">
              <div>
                <p class="text-[10px]/4 font-semibold uppercase tracking-[0.18em] text-primary/70">
                  {{ getDeviceTypeLabel(device.type) }}
                </p>
                <p class="mt-1 text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                  {{ device.brand }} {{ device.model }}
                </p>
                <p class="text-[13px]/5 text-text-main/76">
                  {{ device.serialNumber ? 'Numer seryjny: ' + device.serialNumber : '--' }}
                </p>
              </div>

              <div class="space-y-0.5 text-[13px]/5 text-text-main">
                <div>
                  @if (device.nextInspectionDate) {
                    <span class="font-semibold">
                      Następny przegląd: {{ formatDate(device.nextInspectionDate) }}
                    </span>
                  } @else {
                    <span class="font-semibold">Brak zaplanowanego przeglądu</span>
                  }
                </div>
                <div>Data montażu: {{ formatDate(device.installationDate) }}</div>
                <div class="pt-2 text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Miejsce montażu
                </div>
                <div>{{ device.location || 'Adres klienta' }}</div>
                <div class="text-text-muted">{{ deviceAddress(device) }}</div>
              </div>

              <div class="flex flex-wrap gap-2">
                <ui-button variant="ghost" size="sm" (pressed)="deviceEditRequested.emit(device)">
                  Edytuj
                </ui-button>
                <ui-button variant="ghost" size="sm" (pressed)="deviceSelected.emit(device)">
                  Szczegóły
                </ui-button>
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
})
export class DeviceListComponent {
  readonly devices = input<Device[]>([]);
  readonly deviceSelected = output<Device>();
  readonly deviceEditRequested = output<Device>();

  protected readonly getDeviceTypeLabel = getDeviceTypeLabel;

  protected formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pl-PL').format(parsedDate);
  }

  protected deviceAddress(device: Device): string {
    if (!device.hasCustomInstallationAddress) {
      return 'Adres instalacji taki sam jak adres klienta';
    }

    return [device.address, `${device.postalCode} ${device.city}`.trim()]
      .filter(Boolean)
      .join(', ');
  }
}
