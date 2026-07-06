import {
  parseAuthenticationActionFragment,
  type AuthenticationActionLinkData,
} from './authentication-action-fragment.util';

export type PasswordResetLinkData = AuthenticationActionLinkData;

export function parsePasswordResetFragment(fragment: string): PasswordResetLinkData | null {
  return parseAuthenticationActionFragment(fragment);
}
