import {
  Gb, Mb, Tb, kb,
} from 'app/constants/bits.constant';
import {
  GiB, KiB, MiB, TiB,
} from 'app/constants/bytes.constant';

export function normalizeFileSize(
  value: number,
  baseUnit: 'b' | 'B' = 'B',
  base: 10 | 2 = 2,
): [formatted: number, unit: string] {
  return base === 10 ? normalizeFileSizeBase10(value, baseUnit) : normalizeFileSizeBase2(value, baseUnit);
}

export function buildNormalizedFileSize(
  value: number,
  baseUnit: 'b' | 'B' = 'B',
  base: 10 | 2 = 2,
): string {
  const [formatted, unit] = normalizeFileSize(value, baseUnit, base);
  return `${formatted} ${unit}`;
}

function normalizeFileSizeBase2(value: number, baseUnit: 'b' | 'B'): [formatted: number, unit: string] {
  let formatted = value;
  let increment = 1;
  while (formatted >= 1024) {
    increment *= 1024;
    formatted = value / increment;
  }
  formatted = Math.round((formatted + Number.EPSILON) * 100) / 100;
  switch (increment) {
    case KiB:
      return [formatted, 'Ki' + baseUnit];
    case MiB:
      return [formatted, 'Mi' + baseUnit];
    case GiB:
      return [formatted, 'Gi' + baseUnit];
    case TiB:
      return [formatted, 'Ti' + baseUnit];
    default:
      return [formatted, baseUnit];
  }
}

function normalizeFileSizeBase10(value: number, baseUnit: 'b' | 'B'): [formatted: number, unit: string] {
  let formatted = value;
  let increment = 1;
  while (formatted >= 1000) {
    increment *= 1000;
    formatted = value / increment;
  }
  formatted = Math.round((formatted + Number.EPSILON) * 100) / 100;
  switch (increment) {
    case kb:
      return [formatted, 'k' + baseUnit];
    case Mb:
      return [formatted, 'M' + baseUnit];
    case Gb:
      return [formatted, 'G' + baseUnit];
    case Tb:
      return [formatted, 'T' + baseUnit];
    default:
      return [formatted, baseUnit];
  }
}
