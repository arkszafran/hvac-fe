import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  Device,
  getDeviceCustomerDescription,
  getDeviceCustomerName,
  getDeviceInstallationAddress,
  getDeviceInstallationAddressDetails,
} from '../models/device.model';

@Component({
  selector: 'app-device-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (devices().length) {
      <div class="overflow-hidden rounded-[1.1rem] border border-border/90 bg-white shadow-card">
        <div class="md:hidden">
          @for (device of devices(); track device.id) {
            <article class="border-b border-border/80 px-4 py-4 last:border-b-0 sm:px-5">
              <div class="space-y-3">
                <div class="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-3.5 gap-y-1">
                  <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Marka
                  </p>
                  <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                    {{ device.brand || '--' }}
                  </p>

                  <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Model
                  </p>
                  <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                    {{ device.model || '--' }}
                  </p>

                  <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Adres
                  </p>
                  <div class="min-w-0">
                    <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                      {{ getDeviceInstallationAddress(device) }}
                    </p>
                    <p class="text-[13px]/5 text-text-main/76">
                      {{ getDeviceInstallationAddressDetails(device) }}
                    </p>
                  </div>

                  <p class="pr-2 pt-0.5 text-[10px]/4 font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Klient
                  </p>
                  <div class="min-w-0">
                    <button
                      type="button"
                      class="ui-focus-ring text-left text-[15px]/6 font-semibold tracking-[-0.02em] text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                      (click)="customerPreviewRequested.emit(device.customer)"
                    >
                      {{ getDeviceCustomerName(device) }}
                    </button>
                    <p class="text-[13px]/5 text-text-main/76">
                      {{ getDeviceCustomerDescription(device) }}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          }
        </div>

        <div class="hidden overflow-x-auto md:block">
          <table class="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted first:pl-6">
                  Marka
                </th>
                <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Model
                </th>
                <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Adres instalacji
                </th>
                <th class="border-b border-border/90 bg-[linear-gradient(180deg,_rgb(247_250_255/0.96),_rgb(238_244_255/0.94))] px-5 py-4 text-left text-[11px]/5 font-semibold uppercase tracking-[0.18em] text-text-muted last:pr-6">
                  Klient
                </th>
              </tr>
            </thead>

            <tbody class="[&_tr:last-child_td]:border-b-0">
              @for (device of devices(); track device.id) {
                <tr class="group/row transition duration-200">
                  <td class="border-b border-border/80 bg-white px-5 py-4.5 text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main first:pl-6 group-hover/row:bg-primary-soft/30">
                    {{ device.brand || '--' }}
                  </td>

                  <td class="border-b border-border/80 bg-white px-5 py-4.5 text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main group-hover/row:bg-primary-soft/30">
                    {{ device.model || '--' }}
                  </td>

                  <td class="border-b border-border/80 bg-white px-5 py-4.5 group-hover/row:bg-primary-soft/30">
                    <div class="flex min-w-0 flex-col gap-1">
                      <p class="text-[15px]/6 font-semibold tracking-[-0.02em] text-text-main">
                        {{ getDeviceInstallationAddress(device) }}
                      </p>
                      <p class="text-[13px]/5 text-text-main/76">
                        {{ getDeviceInstallationAddressDetails(device) }}
                      </p>
                    </div>
                  </td>

                  <td class="border-b border-border/80 bg-white px-5 py-4.5 last:pr-6 group-hover/row:bg-primary-soft/30">
                    <div class="flex min-w-0 flex-col gap-1">
                      <button
                        type="button"
                        class="ui-focus-ring w-fit text-left text-[15px]/6 font-semibold tracking-[-0.02em] text-primary-strong underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                        (click)="customerPreviewRequested.emit(device.customer)"
                      >
                        {{ getDeviceCustomerName(device) }}
                      </button>
                      <p class="text-[13px]/5 text-text-main/76">
                        {{ getDeviceCustomerDescription(device) }}
                      </p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    } @else {
      <div class="overflow-hidden rounded-[1.1rem] border border-border/90 bg-white shadow-card">
        <div class="px-5 py-10 text-center sm:px-6">
          <div class="mx-auto flex max-w-sm flex-col items-center rounded-[1rem] border border-dashed border-border/90 bg-[linear-gradient(180deg,_rgb(255_255_255/0.96),_rgb(247_249_252/0.9))] px-6 py-8">
            <div class="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.82)]">
              <svg viewBox="0 0 20 20" fill="none" class="size-5">
                <path
                  d="M4.5 6.5H15.5M6.5 10H13.5M7.5 13.5H12.5"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <p class="mt-4 text-label text-text-main">Brak urządzeń</p>
            <p class="mt-1 text-body text-text-muted">
              Po dodaniu urządzeń zobaczysz tutaj markę, model, adres instalacji i powiązanego klienta.
            </p>
          </div>
        </div>
      </div>
    }
  `,
})
export class DeviceTableComponent {
  readonly devices = input<Device[]>([]);

  readonly customerPreviewRequested = output<Device['customer']>();

  protected readonly getDeviceCustomerName = getDeviceCustomerName;
  protected readonly getDeviceCustomerDescription = getDeviceCustomerDescription;
  protected readonly getDeviceInstallationAddress = getDeviceInstallationAddress;
  protected readonly getDeviceInstallationAddressDetails = getDeviceInstallationAddressDetails;
}
