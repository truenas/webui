import { PoolCapacityLevel } from 'app/enums/pool-capacity-level.enum';

/**
 * Pool capacity threshold (percent) at which the UI flags a pool as "low
 * capacity" and tier rewrite jobs default to triggering. Shared between the
 * pools-dashboard pool-usage-card, the storage widget pool-usage-gauge, and
 * the tier-config-form's default for `max_used_percentage`.
 */
export const poolLowCapacityPercent = 80;

/**
 * Pool capacity threshold (percent) at which usage stops being a warning and
 * becomes critical.
 */
export const poolCriticalCapacityPercent = 90;

/**
 * Single source of truth for how used space maps to a severity, so the same
 * percentage never reads as healthy in one place and critical in another.
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
