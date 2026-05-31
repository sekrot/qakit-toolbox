import SparkMD5 from 'spark-md5';

export type Algorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';

export const ALGORITHMS: Algorithm[] = ['md5', 'sha1', 'sha256', 'sha512'];

export const ALGO_LABELS: Record<Algorithm, string> = {
  md5: 'MD5',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
};

export async function hashString(input: string, algo: Algorithm): Promise<string> {
  if (algo === 'md5') return SparkMD5.hash(input);
  const bytes = new TextEncoder().encode(input);
  return subtleHash(bytes, algo);
}

export async function hashBytes(bytes: Uint8Array, algo: Algorithm): Promise<string> {
  if (algo === 'md5') {
    const spark = new SparkMD5.ArrayBuffer();
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    spark.append(ab);
    return spark.end();
  }
  return subtleHash(bytes, algo);
}

async function subtleHash(bytes: Uint8Array, algo: Exclude<Algorithm, 'md5'>): Promise<string> {
  const name = algo === 'sha1' ? 'SHA-1' : algo === 'sha256' ? 'SHA-256' : 'SHA-512';
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const digest = await crypto.subtle.digest(name, ab);
  return bufferToHex(digest);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < view.length; i++) hex += view[i].toString(16).padStart(2, '0');
  return hex;
}

export async function hashFile(file: File, algo: Algorithm): Promise<string> {
  if (algo === 'md5') {
    const spark = new SparkMD5.ArrayBuffer();
    const chunkSize = 2 * 1024 * 1024;
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
      spark.append(chunk);
    }
    return spark.end();
  }
  const buf = await file.arrayBuffer();
  return subtleHash(new Uint8Array(buf), algo);
}
