import { signal } from '@angular/core';
import { mockProvider } from '@ngneat/spectator/jest';
import { tnIconMarker } from '@truenas/ui-components';
import { Observable, map, of } from 'rxjs';
import { SharingTierInfo, ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';

interface TierRow {
  tier?: SharingTierInfo | null;
  locked?: boolean | null;
}

interface DatasetTierRow extends TierRow {
  dataset?: string;
}

interface MockOpts {
  enabled?: boolean;
  jobUpdates$?: Observable<ZfsTierRewriteJobEntry>;
  /**
   * Per-job status stream returned by `subscribeTierJobStatus`. Kept separate
   * from `jobUpdates$` on purpose: that one drives list reloads, this one drives
   * the live badge, and sharing a fixture between them would let a spec assert
   * one behaviour while silently exercising both.
   */
  jobStatus$?: Observable<ZfsTierRewriteJobEntry>;
}

export function mockSharingTierService(opts: MockOpts = {}): ReturnType<typeof mockProvider> {
  const enabled = opts.enabled ?? false;
  const jobUpdates$ = opts.jobUpdates$ ?? of();
  const jobStatus$ = opts.jobStatus$ ?? of();

  const buildAction = <T extends TierRow>(actionOpts: { reload: () => void }): IconActionConfig<T> => ({
    iconName: tnIconMarker('swap-horizontal', 'mdi'),
    tooltip: 'Change Storage Tier',
    hidden: (row) => of(!enabled || !row.tier || Boolean(row.locked)),
    onClick: () => actionOpts.reload(),
  });

  // Mirrors the real factory, which composes its extra `!row.dataset` clause on top of the shared
  // hide rules rather than restating them, so the two cannot drift apart.
  const buildDatasetAction = <T extends DatasetTierRow>(actionOpts: { reload: () => void }): IconActionConfig<T> => {
    const base = buildAction<T>(actionOpts);
    return {
      ...base,
      hidden: (row) => base.hidden(row).pipe(map((hidden) => hidden || !row.dataset)),
    };
  };

  return mockProvider(SharingTierService, {
    tierEnabled: signal(enabled).asReadonly(),
    getTierConfig: () => of({ enabled }),
    subscribeTierJobUpdates: () => jobUpdates$,
    subscribeTierJobStatus: jest.fn(() => jobStatus$),
    tierJobRefreshes$: () => jobUpdates$,
    openChangeTierDialog: jest.fn(() => of(true)),
    openChangeTierDialogForDataset: jest.fn(() => of(true)),
    wireTierJobRefresh: (wireOpts: { reload: () => void }) => {
      jobUpdates$.subscribe(() => wireOpts.reload());
    },
    createChangeTierAction: buildAction,
    createChangeDatasetTierAction: buildDatasetAction,
  });
}
