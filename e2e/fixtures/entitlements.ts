/**
 * What this appliance is licensed to offer, over the API.
 *
 * The UI greys out a feature the entitlement engine denies and tags it Premium, so a journey
 * that drives one of those controls cannot run here — the control is inert by design, and the
 * click times out rather than failing on anything the journey is about.
 *
 * This is how such a journey asks first. It is not a CI workaround: a community appliance is
 * denied `S3_AUDIT` and `S3_VERSIONING` whatever middleware it runs (`Vector(ce=0, hw=0, …)` in
 * `middlewared/utils/entitlements/matrix.py` grants them only in the key-bearing columns), so
 * these journeys are unrunnable there for the same reason they are unrunnable on the lab box.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** The decisions `truenas.entitlements.info` reports, keyed by policy identifier. */
export type EntitlementDecisions = Record<string, { entitled: boolean }>;

export async function readEntitlements(client: E2eApiClient): Promise<EntitlementDecisions> {
  const info = await firstValueFrom(
    client.api.call('truenas.entitlements.info').pipe(timeout(readTimeoutMs)),
  );

  return info.features;
}

/**
 * Whether the UI will offer `feature`, read the way the UI reads it.
 *
 * An absent key counts as denied, matching `selectIsEntitledStrictly` — the gate these journeys
 * actually run into. Middleware's own `check` calls an absent key "not gated", but a middleware
 * whose POLICY lacks the key cannot enforce the feature either, and the UI fails closed for the
 * S3 keys on that basis. Asking the question any other way here would let a journey start and
 * then time out on a control the app has locked.
 */
export function isEntitled(decisions: EntitlementDecisions, feature: string): boolean {
  return decisions[feature]?.entitled ?? false;
}

/** Policy identifiers this suite asks about. Mirrors `app/enums/entitlement-feature.enum.ts`. */
export const entitlementFeature = {
  s3Audit: 'S3_AUDIT',
  s3Versioning: 'S3_VERSIONING',
} as const;
