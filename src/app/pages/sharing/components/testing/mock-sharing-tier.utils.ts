import { mockProvider } from '@ngneat/spectator/jest';
import { tnIconMarker } from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { SharingTierInfo, ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';

interface TierRow {
  tier?: SharingTierInfo | null;
  locked?: boolean;
}

interface MockOpts {
  enabled?: boolean;
  jobUpdates$?: Observable<ZfsTierRewriteJobEntry>;
}

export function mockSharingTierService(opts: MockOpts = {}): ReturnType<typeof mockProvider> {
  const enabled = opts.enabled ?? false;
  const jobUpdates$ = opts.jobUpdates$ ?? of();

  return mockProvider(SharingTierService, {
    getTierConfig: () => of({ enabled }),
    subscribeTierJobUpdates: () => jobUpdates$,
    tierJobRefreshes$: () => jobUpdates$,
    openChangeTierDialog: jest.fn(() => of(true)),
    openChangeTierDialogForDataset: jest.fn(() => of(true)),
    wireTierColumnUpdates: (wireOpts: { reload: () => void }) => {
      jobUpdates$.subscribe(() => wireOpts.reload());
    },
    createChangeTierAction: <T extends TierRow>(actionOpts: { reload: () => void }): IconActionConfig<T> => ({
      iconName: tnIconMarker('swap-horizontal', 'mdi'),
      tooltip: 'Change Storage Tier',
      hidden: (row) => of(!enabled || !row.tier || Boolean(row.locked)),
      onClick: () => actionOpts.reload(),
    }),
  });
}
