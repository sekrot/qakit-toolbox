export interface JwtClaims {
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface JwtParts {
  header: Record<string, unknown>;
  payload: JwtClaims;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
}

export interface JwtStatus {
  expired: boolean;
  notYetValid: boolean;
  expiresIn?: number;
  issuedAgo?: number;
}

export interface JwtResult {
  ok: boolean;
  parts?: JwtParts;
  status?: JwtStatus;
  error?: string;
}

export function decodeJwt(token: string, now: number = Date.now()): JwtResult {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: 'Token is empty' };

  const segments = trimmed.split('.');
  if (segments.length !== 3) {
    return { ok: false, error: `Expected 3 segments separated by ".", got ${segments.length}` };
  }

  const [headerSeg, payloadSeg, signature] = segments;
  let header: Record<string, unknown>;
  let payload: JwtClaims;
  let headerRaw: string;
  let payloadRaw: string;

  try {
    headerRaw = base64UrlDecode(headerSeg);
    header = JSON.parse(headerRaw);
  } catch (e) {
    return { ok: false, error: `Header: ${errMsg(e)}` };
  }
  try {
    payloadRaw = base64UrlDecode(payloadSeg);
    payload = JSON.parse(payloadRaw);
  } catch (e) {
    return { ok: false, error: `Payload: ${errMsg(e)}` };
  }

  return {
    ok: true,
    parts: { header, payload, signature, headerRaw, payloadRaw },
    status: computeStatus(payload, now),
  };
}

function computeStatus(payload: JwtClaims, now: number): JwtStatus {
  const nowSec = Math.floor(now / 1000);
  const expiresIn = typeof payload.exp === 'number' ? payload.exp - nowSec : undefined;
  const issuedAgo = typeof payload.iat === 'number' ? nowSec - payload.iat : undefined;
  return {
    expired: typeof payload.exp === 'number' ? payload.exp < nowSec : false,
    notYetValid: typeof payload.nbf === 'number' ? payload.nbf > nowSec : false,
    expiresIn,
    issuedAgo,
  };
}

export function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60) return `${abs}s`;
  if (abs < 3600) return `${Math.floor(abs / 60)}m ${abs % 60}s`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ${Math.floor((abs % 3600) / 60)}m`;
  return `${Math.floor(abs / 86400)}d ${Math.floor((abs % 86400) / 3600)}h`;
}
