import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AppNavigationIcon } from '../app-navigation';

@Component({
  selector: 'app-layout-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" fill="none" class="size-5" aria-hidden="true">
      @switch (name()) {
        @case ('dashboard') {
          <path
            d="M4 6.75C4 5.784 4.784 5 5.75 5H10.25C11.216 5 12 5.784 12 6.75V11.25C12 12.216 11.216 13 10.25 13H5.75C4.784 13 4 12.216 4 11.25V6.75Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M14 6.75C14 5.784 14.784 5 15.75 5H18.25C19.216 5 20 5.784 20 6.75V9.25C20 10.216 19.216 11 18.25 11H15.75C14.784 11 14 10.216 14 9.25V6.75Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M14 15.75C14 14.784 14.784 14 15.75 14H18.25C19.216 14 20 14.784 20 15.75V18.25C20 19.216 19.216 20 18.25 20H15.75C14.784 20 14 19.216 14 18.25V15.75Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M4 16.75C4 15.232 5.232 14 6.75 14H9.25C10.768 14 12 15.232 12 16.75V17.25C12 18.768 10.768 20 9.25 20H6.75C5.232 20 4 18.768 4 17.25V16.75Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
        }
        @case ('customers') {
          <path
            d="M8 12C9.657 12 11 10.657 11 9C11 7.343 9.657 6 8 6C6.343 6 5 7.343 5 9C5 10.657 6.343 12 8 12Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M16.5 10.5C17.881 10.5 19 9.381 19 8C19 6.619 17.881 5.5 16.5 5.5C15.119 5.5 14 6.619 14 8C14 9.381 15.119 10.5 16.5 10.5Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M3.5 18.5C3.5 16.291 5.291 14.5 7.5 14.5H8.5C10.709 14.5 12.5 16.291 12.5 18.5V19H3.5V18.5Z"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
          <path
            d="M13.5 19V18.5C13.5 16.567 15.067 15 17 15C18.933 15 20.5 16.567 20.5 18.5V19"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        }
        @case ('devices') {
          <path
            d="M6.5 7.5C6.5 6.119 7.619 5 9 5H15C16.381 5 17.5 6.119 17.5 7.5V15.5C17.5 16.881 16.381 18 15 18H9C7.619 18 6.5 16.881 6.5 15.5V7.5Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M8.5 8.5H15.5"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
          <path
            d="M10 14.5H14"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
          <path
            d="M4.5 9.5V13.5"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
          <path
            d="M4.5 11.5H6.5"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        }
        @case ('requests') {
          <path
            d="M7.5 5H16.5C18.433 5 20 6.567 20 8.5V15.5C20 17.433 18.433 19 16.5 19H7.5C5.567 19 4 17.433 4 15.5V8.5C4 6.567 5.567 5 7.5 5Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M8 9H16M8 12H13M8 15H11"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        }
        @case ('visits') {
          <path
            d="M7.5 4.5V7.5M16.5 4.5V7.5"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
          <path
            d="M5.75 6H18.25C19.216 6 20 6.784 20 7.75V18.25C20 19.216 19.216 20 18.25 20H5.75C4.784 20 4 19.216 4 18.25V7.75C4 6.784 4.784 6 5.75 6Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M4.5 10H19.5"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
          <path
            d="M8 14H12.5M8 17H15.5"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        }
        @case ('reviews') {
          <path
            d="M12 4L14.472 9.008L20 9.812L16 13.71L16.944 19.216L12 16.616L7.056 19.216L8 13.71L4 9.812L9.528 9.008L12 4Z"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
        }
        @case ('settings') {
          <path
            d="M12 9.25C10.481 9.25 9.25 10.481 9.25 12C9.25 13.519 10.481 14.75 12 14.75C13.519 14.75 14.75 13.519 14.75 12C14.75 10.481 13.519 9.25 12 9.25Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M19 12C19 11.373 18.934 10.763 18.809 10.175L20.5 8.864L18.136 4.769L16.096 5.58C15.159 4.802 14.035 4.241 12.806 3.976L12.5 2H7.5L7.194 3.976C5.965 4.241 4.841 4.802 3.904 5.58L1.864 4.769L-0.5 8.864L1.191 10.175C1.066 10.763 1 11.373 1 12C1 12.627 1.066 13.237 1.191 13.825L-0.5 15.136L1.864 19.231L3.904 18.42C4.841 19.198 5.965 19.759 7.194 20.024L7.5 22H12.5L12.806 20.024C14.035 19.759 15.159 19.198 16.096 18.42L18.136 19.231L20.5 15.136L18.809 13.825C18.934 13.237 19 12.627 19 12Z"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
            transform="translate(1.5 0)"
          />
        }
        @case ('menu') {
          <path
            d="M4 7H20M4 12H20M4 17H20"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        }
        @case ('bell') {
          <path
            d="M7 10.5C7 7.739 9.239 5.5 12 5.5C14.761 5.5 17 7.739 17 10.5V12.923C17 13.59 17.222 14.238 17.631 14.766L18.5 15.889C18.909 16.417 18.533 17.2 17.865 17.2H6.135C5.467 17.2 5.091 16.417 5.5 15.889L6.369 14.766C6.778 14.238 7 13.59 7 12.923V10.5Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path
            d="M10 18.2C10.348 19.024 11.12 19.6 12 19.6C12.88 19.6 13.652 19.024 14 18.2"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        }
      }
    </svg>
  `,
})
export class AppLayoutIconComponent {
  readonly name = input<AppNavigationIcon>('dashboard');
}
