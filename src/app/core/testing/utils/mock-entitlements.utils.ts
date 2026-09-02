import { FactoryProvider } from '@angular/core';
import { mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { EntitlementEntry } from 'app/interfaces/entitlement.interface';
import { EntitlementsService } from 'app/services/entitlements.service';

/**
 * Provides entitlement decisions to a component under test.
 *
 * Everything is entitled unless named in `denied`. That default matters: `entitled$` emits
 * nothing until entitlements resolve, so a spec that leaves the store empty sees gated
 * surfaces never appear and fails for a reason that looks nothing like the cause.
 *
 * @param denied Features to report as denied, optionally with the reason driving the copy.
 */
export function mockEntitlements(
  denied: EntitlementFeature[] | Partial<Record<EntitlementFeature, EntitlementReason>> = [],
): FactoryProvider {
  const reasons = Array.isArray(denied)
    ? Object.fromEntries(denied.map((feature) => [feature, EntitlementReason.KeyMissing]))
    : denied;

  return mockProvider(EntitlementsService, {
    entitled$: (feature: EntitlementFeature) => of(!(feature in reasons)),
    entitled: (feature: EntitlementFeature) => () => !(feature in reasons),
    entitlement: (feature: EntitlementFeature) => () => {
      const reason = reasons[feature];
      return reason
        ? { entitled: false, reason, message: `${feature} is not available.` } as EntitlementEntry
        : undefined;
    },
  }) as FactoryProvider;
}
