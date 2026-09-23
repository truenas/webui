import { kb, Yb } from 'app/constants/bits.constant';
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

/**
 * {@link buildNormalizedFileSize}, except the rendering is never smaller than `value`.
 *
 * `buildNormalizedFileSize` rounds to the nearest hundredth of a unit, so a size a
 * hair above a round one reads as that round one: 50 GiB + 4 KiB renders as `50 GiB`.
 * That is fine to read, but wrong to quote as a minimum — it names a size that is
 * still too small. Rounding the last shown digit up keeps the rendering a size that
 * actually covers `value`.
 */
export function buildRoundedUpFileSize(
  value: number,
  baseUnit: 'b' | 'B' = 'B',
  base: 10 | 2 = 2,
): string {
  return buildRoundedFileSize(value, baseUnit, base, 1);
}

/**
 * {@link buildNormalizedFileSize}, except the rendering is never larger than `value`.
 *
 * The mirror of {@link buildRoundedUpFileSize}, for a size quoted as a maximum: rounding
 * 50 GiB - 1 to the nearest hundredth of a unit advertises `50 GiB` as the ceiling, and
 * 50 GiB is over it. Rounding the last shown digit down keeps the rendering a size that
 * `value` actually allows.
 */
export function buildRoundedDownFileSize(
  value: number,
  baseUnit: 'b' | 'B' = 'B',
  base: 10 | 2 = 2,
): string {
  return buildRoundedFileSize(value, baseUnit, base, -1);
}

export function convertStringDiskSizeToBytes(input: string): number | null {
  const sizeRegex = /^(\d+(\.\d+)?)([KMGTP](?:i)?(?:B)?)?$/i;
  const match = sizeRegex.exec(input.replace(/\s+/g, ''));

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
  return normalizeAgainstUnit(value, baseUnit, 2);
}

function normalizeFileSizeBase10(value: number, baseUnit: 'b' | 'B'): [formatted: number, unit: string] {
  return normalizeAgainstUnit(value, baseUnit, 10);
}

function normalizeAgainstUnit(value: number, baseUnit: 'b' | 'B', base: 10 | 2): [number, string] {
  const [increment, unit] = pickFileSizeUnit(value, baseUnit, base);
  const formatted = Math.round(((value / increment) + Number.EPSILON) * 100) / 100;
  return [formatted, unit];
}

/**
 * Picks the largest unit `value` still reads as at least one of, and returns how many
 * bytes (or bits) that unit is worth alongside its symbol.
 */
function pickFileSizeUnit(value: number, baseUnit: 'b' | 'B', base: 10 | 2): [increment: number, unit: string] {
  const step = base === 10 ? kb : KiB;
  const largest = base === 10 ? Yb : YiB;
  const prefixes = base === 10
    ? ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
    : ['Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'];

  let increment = 1;
  let steps = 0;
  while (value / increment >= step && increment < largest) {
    increment *= step;
    steps++;
  }

  return [increment, (steps ? prefixes[steps - 1] : '') + baseUnit];
}

/**
 * Renders `value` to a hundredth of a unit, rounding away from the bound it is quoted as:
 * `direction` 1 never renders below `value`, -1 never renders above it.
 */
function buildRoundedFileSize(value: number, baseUnit: 'b' | 'B', base: 10 | 2, direction: 1 | -1): string {
  const [increment, unit] = pickFileSizeUnit(value, baseUnit, base);

  const scaled = (value / increment) * 100;
  let hundredths = direction > 0 ? Math.ceil(scaled) : Math.floor(scaled);
  // The quotient is a float, so the rounding can still land on the wrong side of `value`.
  while ((hundredths / 100) * increment * direction < value * direction) {
    hundredths += direction;
  }

  return `${hundredths / 100} ${unit}`;
}
