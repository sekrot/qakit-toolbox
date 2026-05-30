import { describe, expect, it } from 'vitest';
import { decodeJwt, base64UrlDecode, formatDuration } from './logic';

// header: {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":1516242622}
const VALID_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.' +
  'fakesignature';

describe('base64UrlDecode', () => {
  it('decodes URL-safe base64 with missing padding', () => {
    expect(base64UrlDecode('SGVsbG8')).toBe('Hello');
  });

  it('handles - and _ chars', () => {
    expect(base64UrlDecode('Pz8_Pw')).toBe('????');
  });

  it('decodes UTF-8', () => {
    expect(base64UrlDecode('w6TDtsO8')).toBe('äöü');
  });
});

describe('decodeJwt', () => {
  it('decodes a valid token', () => {
    const r = decodeJwt(VALID_TOKEN, new Date('2018-01-18T01:30:22Z').getTime());
    expect(r.ok).toBe(true);
    expect(r.parts?.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(r.parts?.payload.name).toBe('John Doe');
    expect(r.parts?.signature).toBe('fakesignature');
  });

  it('marks token as expired when exp is in the past', () => {
    const r = decodeJwt(VALID_TOKEN, new Date('2030-01-01T00:00:00Z').getTime());
    expect(r.status?.expired).toBe(true);
  });

  it('marks token as not expired when exp is in the future', () => {
    const r = decodeJwt(VALID_TOKEN, new Date('2018-01-18T01:00:00Z').getTime());
    expect(r.status?.expired).toBe(false);
    expect(r.status?.expiresIn).toBeGreaterThan(0);
  });

  it('errors on empty input', () => {
    expect(decodeJwt('').ok).toBe(false);
  });

  it('errors on wrong segment count', () => {
    expect(decodeJwt('not.a.jwt.token').ok).toBe(false);
    expect(decodeJwt('only.one').ok).toBe(false);
  });

  it('errors on malformed header', () => {
    const r = decodeJwt('!!!.eyJhIjoxfQ.sig');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Header/);
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(45)).toBe('45s');
  });
  it('formats minutes', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });
  it('formats hours', () => {
    expect(formatDuration(3661)).toBe('1h 1m');
  });
  it('formats days', () => {
    expect(formatDuration(90061)).toBe('1d 1h');
  });
});
