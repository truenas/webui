import { PoolCapacityLevel } from 'app/enums/pool-capacity-level.enum';

/**
 * Percent of used space at which pool capacity stops being safe and starts
 * warning. Also the point at which tier rewrite jobs default to triggering.
 */
export const poolLowCapacityPercent = 80;

/**
 * Percent of used space at which pool capacity stops being a warning and
 * becomes critical.
 */
export const poolCriticalCapacityPercent = 90;

/**
 * Single source of truth for how used space maps to a severity, so the same
 * percentage never reads as healthy in one place and critical in another.
 * Consumers should go through this rather than comparing to the constants
 * directly. Note that the tier-config-form still hardcodes its own 80 default
 * for `max_used_percentage`; pointing it here is a worthwhile follow-up.
 *
 * @param usedPercent Used space as a percentage (0-100), not a fraction.
 */
export function getPoolCapacityLevel(usedPercent: number): PoolCapacityLevel {
  if (usedPercent >= poolCriticalCapacityPercent) {
    return PoolCapacityLevel.Critical;
  }

  if (usedPercent >= poolLowCapacityPercent) {
    return PoolCapacityLevel.Warning;
  }

  return PoolCapacityLevel.Safe;
}

/**
 * Theme colors a pool usage gauge picks from, supplied by the consuming
 * component since each pulls slightly different values off the current theme.
 */
export interface PoolCapacityGaugeColors {
  blank: string;
  fill: string;
  warning: string;
  critical: string;
}

/**
 * Gauge fill color for a used percentage, so the gauge can never disagree with
 * the severity the rest of the card reports.
 *
 * @param usedPercent Used space as a percentage (0-100), not a fraction.
 */
export function getPoolCapacityGaugeFill(usedPercent: number, colors: PoolCapacityGaugeColors): string {
  if (usedPercent === 0) {
    return colors.blank;
  }

  switch (getPoolCapacityLevel(usedPercent)) {
    case PoolCapacityLevel.Critical:
      return colors.critical;
    case PoolCapacityLevel.Warning:
      return colors.warning;
    default:
      return colors.fill;
  }
}

/**
 * Inline style that tints the gauge's label to match its fill.
 *
 * @param usedPercent Used space as a percentage (0-100), not a fraction.
 */
export function getPoolCapacityGaugeLabelStyle(usedPercent: number): string {
  switch (getPoolCapacityLevel(usedPercent)) {
    case PoolCapacityLevel.Critical:
      return 'color: var(--red);';
    case PoolCapacityLevel.Warning:
      return 'color: var(--orange);';
    default:
      return '';
  }
}
