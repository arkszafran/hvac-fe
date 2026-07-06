import { HttpContextToken } from '@angular/common/http';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);
export const SKIP_API_REDIRECT = new HttpContextToken<boolean>(() => false);
