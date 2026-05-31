export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export function parseHex(input: string): RGB | null {
  let s = input.trim().replace(/^#/, '');
  if (s.length === 3)
    s = s
      .split('')
      .map((c) => c + c)
      .join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (n: number) =>
    Math.round(clamp(n, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function formatRgb(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatRgba(rgb: RGB, alpha = 1): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function formatHsl(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

export function formatHsla(hsl: HSL, alpha = 1): string {
  return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
}

export function formatCmyk(cmyk: CMYK): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

export function isEyeDropperSupported(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window;
}

interface EyeDropperApi {
  open(): Promise<{ sRGBHex: string }>;
}
interface EyeDropperCtor {
  new (): EyeDropperApi;
}

export async function pickColor(): Promise<string | null> {
  if (!isEyeDropperSupported()) return null;
  try {
    const Ctor = (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper;
    const eyeDropper = new Ctor();
    const { sRGBHex } = await eyeDropper.open();
    return sRGBHex;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
