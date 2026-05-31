import { describe, expect, it } from 'vitest';
import { hashString } from './logic';

describe('hashString', () => {
  it('computes MD5 of empty string', async () => {
    expect(await hashString('', 'md5')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('computes MD5 of "abc"', async () => {
    expect(await hashString('abc', 'md5')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('computes SHA-1 of "abc"', async () => {
    expect(await hashString('abc', 'sha1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  it('computes SHA-256 of "abc"', async () => {
    expect(await hashString('abc', 'sha256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('computes SHA-512 of "abc"', async () => {
    expect(await hashString('abc', 'sha512')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
        '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
  });

  it('handles UTF-8', async () => {
    expect(await hashString('héllo', 'sha256')).toBe(
      '3c48591d8d098a4538f5e013dfcf406e948eac4d3277b10bf614e295d6068179',
    );
  });
});
