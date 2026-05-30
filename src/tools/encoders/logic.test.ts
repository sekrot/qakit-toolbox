import { describe, expect, it } from 'vitest';
import { transform, detectDirection } from './logic';

describe('base64', () => {
  it('encodes ASCII', () => {
    expect(transform('Hello', 'base64', 'encode').output).toBe('SGVsbG8=');
  });
  it('decodes ASCII', () => {
    expect(transform('SGVsbG8=', 'base64', 'decode').output).toBe('Hello');
  });
  it('round-trips UTF-8', () => {
    const encoded = transform('Привет, мир 🌍', 'base64', 'encode').output!;
    expect(transform(encoded, 'base64', 'decode').output).toBe('Привет, мир 🌍');
  });
  it('errors on invalid base64', () => {
    expect(transform('!!!not-base64!!!', 'base64', 'decode').ok).toBe(false);
  });
});

describe('base64url', () => {
  it('encodes without padding and with URL-safe chars', () => {
    const r = transform('subjects?', 'base64url', 'encode').output!;
    expect(r).not.toMatch(/[+/=]/);
  });
  it('round-trips', () => {
    const encoded = transform('Привет', 'base64url', 'encode').output!;
    expect(transform(encoded, 'base64url', 'decode').output).toBe('Привет');
  });
  it('decodes input that is missing padding', () => {
    expect(transform('SGVsbG8', 'base64url', 'decode').output).toBe('Hello');
  });
});

describe('url', () => {
  it('encodes special chars', () => {
    expect(transform('hello world?a=1&b=2', 'url', 'encode').output).toBe(
      'hello%20world%3Fa%3D1%26b%3D2',
    );
  });
  it('decodes percent-encoding', () => {
    expect(transform('hello%20world', 'url', 'decode').output).toBe('hello world');
  });
  it('errors on malformed percent-encoding', () => {
    expect(transform('%ZZ', 'url', 'decode').ok).toBe(false);
  });
});

describe('detectDirection', () => {
  it('treats valid base64 as decode candidate', () => {
    expect(detectDirection('SGVsbG8=', 'base64')).toBe('decode');
  });
  it('treats plain text as encode candidate', () => {
    expect(detectDirection('Hello world!', 'base64')).toBe('encode');
  });
  it('detects URL-encoded input', () => {
    expect(detectDirection('hello%20world', 'url')).toBe('decode');
  });
  it('detects plain URL input as encode', () => {
    expect(detectDirection('hello world', 'url')).toBe('encode');
  });
});
