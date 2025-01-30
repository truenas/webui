import {
  Gb, kb, Mb, Tb, Pb, Eb, Zb, Yb,
} from 'app/constants/bits.constant';
import {
  GiB, KiB, MiB, PiB, TiB, EiB, ZiB, YiB,
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

export function convertStringDiskSizeToBytes(input: string): number | null {
  const sizeRegex = /^(\d+(\.\d+)?)([KMGTP](?:i)?(?:B)?)?$/i;
  const match = input.replace(/\s+/g, '').match(sizeRegex);

  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  let unit = match[3]?.toUpperCase() || '';

  const units = [
    'B', 'Gb', 'kb', 'Mb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb',
    'GiB', 'KiB', 'MiB', 'PiB', 'TiB', 'EiB', 'ZiB', 'YiB',
  ];

  unit = units.find((item) => item.toUpperCase().includes(unit.toUpperCase())) || 'B';

  const unitMultipliers: Record<string, number> = {
    B: 1,
    KIB: KiB,
    MIB: MiB,
    GIB: GiB,
    TIB: TiB,
    PIB: PiB,
    EIB: EiB,
    ZIB: ZiB,
    YIB: YiB,
    KB: KiB,
    MB: MiB,
    GB: GiB,
    TB: TiB,
    PB: PiB,
    EB: EiB,
    ZB: ZiB,
    YB: YiB,
  };

  return value * (unitMultipliers[unit.toUpperCase()] || 1);
}

function normalizeFileSizeBase2(value: number, baseUnit: 'b' | 'B'): [formatted: number, unit: string] {
  let formatted = value;
  let increment = 1;
  while (formatted >= KiB && increment < YiB) {
    increment *= KiB;
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
    case PiB:
      return [formatted, 'Pi' + baseUnit];
    case EiB:
      return [formatted, 'Ei' + baseUnit];
    case ZiB:
      return [formatted, 'Zi' + baseUnit];
    case YiB:
      return [formatted, 'Yi' + baseUnit];
    default:
      return [formatted, baseUnit];
  }
}

function normalizeFileSizeBase10(value: number, baseUnit: 'b' | 'B'): [formatted: number, unit: string] {
  let formatted = value;
  let increment = 1;
  while (formatted >= kb && increment < Yb) {
    increment *= kb;
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
    case Pb:
      return [formatted, 'P' + baseUnit];
    case Eb:
      return [formatted, 'E' + baseUnit];
    case Zb:
      return [formatted, 'Z' + baseUnit];
    case Yb:
      return [formatted, 'Y' + baseUnit];
    default:
      return [formatted, baseUnit];
  }
}
