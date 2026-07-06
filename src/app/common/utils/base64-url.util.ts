export function decodeBase64Url(value: string): string | null {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) {
    return null;
  }

  try {
    const base64Value = value.replace(/-/g, '+').replace(/_/g, '/');
    const paddedValue = base64Value.padEnd(Math.ceil(base64Value.length / 4) * 4, '=');
    const binaryValue = atob(paddedValue);
    const bytes = Uint8Array.from(binaryValue, (character) => character.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
