export type EncoderKind = 'base64' | 'base64url' | 'url';
export type Direction = 'encode' | 'decode';

export interface EncoderResult {
  ok: boolean;
  output?: string;
  error?: string;
}

export function transform(input: string, kind: EncoderKind, direction: Direction): EncoderResult {
  if (!input) return { ok: true, output: '' };
  try {
    if (direction === 'encode') return { ok: true, output: encode(input, kind) };
    return { ok: true, output: decode(input, kind) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function encode(input: string, kind: EncoderKind): string {
  switch (kind) {
    case 'base64':
      return bytesToBase64(new TextEncoder().encode(input));
    case 'base64url':
      return bytesToBase64(new TextEncoder().encode(input))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    case 'url':
      return encodeURIComponent(input);
  }
}

function decode(input: string, kind: EncoderKind): string {
  switch (kind) {
    case 'base64':
      return new TextDecoder('utf-8').decode(base64ToBytes(input));
    case 'base64url': {
      const padded = input.replace(/-/g, '+').replace(/_/g, '/');
      const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
      return new TextDecoder('utf-8').decode(base64ToBytes(padded + pad));
    }
    case 'url':
      return decodeURIComponent(input);
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function detectDirection(input: string, kind: EncoderKind): Direction {
  if (!input) return 'encode';
  if (kind === 'url') return input.includes('%') ? 'decode' : 'encode';
  const base64Re = kind === 'base64url' ? /^[A-Za-z0-9_-]+={0,2}$/ : /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Re.test(input.trim()) ? 'decode' : 'encode';
}
