/**
 * Pool capacity threshold (percent) at which the UI flags a pool as "low
 * capacity" and tier rewrite jobs default to triggering. Shared between the
 * pools-dashboard pool-usage-card, the storage widget pool-usage-gauge, and
 * the tier-config-form's default for `max_used_percentage`.
 */
export const poolLowCapacityPercent = 80;
