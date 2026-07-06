import { decodeBase64Url } from '../../../common/utils';

export interface AuthenticationActionLinkData {
  code: string;
  userId: string;
}

type AuthenticationActionRecord = Record<string, unknown>;

export function parseAuthenticationActionFragment(
  fragment: string,
): AuthenticationActionLinkData | null {
  const normalizedFragment = normalizeFragment(fragment);

  if (!normalizedFragment) {
    return null;
  }

  const decodedFragment = decodeBase64Url(normalizedFragment);

  if (decodedFragment === null) {
    return null;
  }

  return parseAuthenticationActionLinkData(decodedFragment);
}

function normalizeFragment(fragment: string): string {
  const fragmentWithoutHash = fragment.startsWith('#') ? fragment.slice(1) : fragment;

  try {
    return decodeURIComponent(fragmentWithoutHash.trim());
  } catch {
    return fragmentWithoutHash.trim();
  }
}

function parseAuthenticationActionLinkData(value: string): AuthenticationActionLinkData | null {
  try {
    const parsedValue: unknown = JSON.parse(value);

    if (!isRecord(parsedValue)) {
      return null;
    }

    const code = parsedValue['code'];
    const userId = parsedValue['userId'];

    if (typeof code !== 'string' || typeof userId !== 'string') {
      return null;
    }

    if (!code || !userId) {
      return null;
    }

    return { code, userId };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is AuthenticationActionRecord {
  return typeof value === 'object' && value !== null;
}
