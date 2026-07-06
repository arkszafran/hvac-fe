import type { LoginDto } from '../../../common/api/authentication';
import { decodeBase64Url } from '../../../common/utils';

type CredentialsRecord = Record<string, unknown>;

export function parseAutoLoginFragment(fragment: string): LoginDto | null {
  const normalizedFragment = normalizeFragment(fragment);

  if (!normalizedFragment) {
    return null;
  }

  return parseCredentials(normalizedFragment) ?? parseBase64UrlCredentials(normalizedFragment);
}

function normalizeFragment(fragment: string): string {
  const fragmentWithoutHash = fragment.startsWith('#') ? fragment.slice(1) : fragment;

  try {
    return decodeURIComponent(fragmentWithoutHash.trim());
  } catch {
    return fragmentWithoutHash.trim();
  }
}

function parseCredentials(value: string): LoginDto | null {
  return parseJsonCredentials(value) ?? parseQueryCredentials(value) ?? parseColonCredentials(value);
}

function parseBase64UrlCredentials(value: string): LoginDto | null {
  const decodedValue = decodeBase64Url(value);

  if (decodedValue === null) {
    return null;
  }

  return parseCredentials(decodedValue);
}

function parseJsonCredentials(value: string): LoginDto | null {
  try {
    const parsedValue: unknown = JSON.parse(value);

    if (!isRecord(parsedValue)) {
      return null;
    }

    return createLoginDto(parsedValue);
  } catch {
    return null;
  }
}

function parseQueryCredentials(value: string): LoginDto | null {
  if (!value.includes('=')) {
    return null;
  }

  const params = new URLSearchParams(value.startsWith('?') ? value.slice(1) : value);
  const payload = params.get('payload') ?? params.get('credentials') ?? params.get('data');

  if (payload) {
    const decodedPayload = decodeBase64Url(payload);
    const payloadCredentials = decodedPayload ? parseCredentials(decodedPayload) : null;

    if (payloadCredentials) {
      return payloadCredentials;
    }
  }

  const email = readDecodedParam(params, 'email') ?? readDecodedParam(params, 'login');
  const password = readDecodedParam(params, 'password');

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

function parseColonCredentials(value: string): LoginDto | null {
  const separatorIndex = value.indexOf(':');

  if (separatorIndex < 1) {
    return null;
  }

  const email = value.slice(0, separatorIndex);
  const password = value.slice(separatorIndex + 1);

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

function createLoginDto(value: CredentialsRecord): LoginDto | null {
  const email = value['email'] ?? value['login'];
  const password = value['password'];

  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

function readDecodedParam(params: URLSearchParams, key: string): string | null {
  const value = params.get(key);

  if (!value) {
    return null;
  }

  return decodeBase64Url(value) ?? value;
}

function isRecord(value: unknown): value is CredentialsRecord {
  return typeof value === 'object' && value !== null;
}
