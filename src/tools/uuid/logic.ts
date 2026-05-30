export type UuidVersion = 'v4' | 'v7' | 'nil';

export function generate(version: UuidVersion): string {
  switch (version) {
    case 'v4':
      return crypto.randomUUID();
    case 'v7':
      return uuidV7();
    case 'nil':
      return '00000000-0000-0000-0000-000000000000';
  }
}

export function generateMany(version: UuidVersion, count: number): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(count)));
  const out: string[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = generate(version);
  return out;
}

function uuidV7(): string {
  const ms = BigInt(Date.now());
  const rnd = new Uint8Array(10);
  crypto.getRandomValues(rnd);

  const bytes = new Uint8Array(16);
  bytes[0] = Number((ms >> 40n) & 0xffn);
  bytes[1] = Number((ms >> 32n) & 0xffn);
  bytes[2] = Number((ms >> 24n) & 0xffn);
  bytes[3] = Number((ms >> 16n) & 0xffn);
  bytes[4] = Number((ms >> 8n) & 0xffn);
  bytes[5] = Number(ms & 0xffn);
  bytes[6] = (0x70 | (rnd[0] & 0x0f)) & 0xff;
  bytes[7] = rnd[1];
  bytes[8] = (0x80 | (rnd[2] & 0x3f)) & 0xff;
  for (let i = 9; i < 16; i++) bytes[i] = rnd[i - 6];

  return formatUuid(bytes);
}

function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUuid(input: string): boolean {
  return UUID_RE.test(input.trim());
}
