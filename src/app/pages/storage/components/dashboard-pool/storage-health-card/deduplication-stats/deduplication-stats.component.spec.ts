import { MatDialog } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Pool } from 'app/interfaces/pool.interface';
import {
  DeduplicationStatsComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/deduplication-stats/deduplication-stats.component';
import {
  PruneDedupTableDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/prune-dedup-table-dialog/prune-dedup-table-dialog.component';
import {
  SetDedupQuotaComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/set-dedup-quota/set-dedup-quota.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';

describe('DeduplicationStatsComponent', () => {
  let spectator: Spectator<DeduplicationStatsComponent>;
  const createComponent = createComponentFactory({
    component: DeduplicationStatsComponent,
    providers: [
      mockProvider(PoolsDashboardStore),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of()),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        pool: {
          dedup_table_quota: 'auto',
          dedup_table_size: 100 * KiB,
        } as Pool,
      },
    });
  });

  it('shows deduplication stats for various quota settings', () => {
    // Auto
    spectator.setInput('pool', {
      dedup_table_quota: 'auto',
      dedup_table_size: 100 * KiB,
    } as Pool);
    expect(spectator.query(byText('Deduplication Table:'))!.parentElement!.querySelector('.value')).toHaveText('100 KiB');

    // Custom
    spectator.setInput('pool', {
      dedup_table_quota: String(200 * KiB),
      dedup_table_size: 100 * KiB,
    } as Pool);
    expect(spectator.query(byText('Deduplication Table:'))!.parentElement!.querySelector('.value')).toHaveText('100 KiB / 200 KiB');

    // None
    spectator.setInput('pool', {
      dedup_table_quota: '0',
      dedup_table_size: 100 * KiB,
    } as Pool);
    expect(spectator.query(byText('Deduplication Table:'))!.parentElement!.querySelector('.value')).toHaveText('100 KiB');
  });

  it('opens SetDedupQuotaComponent when Set Quota is pressed', () => {
    spectator.setInput('pool', {
      dedup_table_size: 100 * KiB,
    } as Pool);

    spectator.click(spectator.query(byText('Set Quota'))!);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SetDedupQuotaComponent, {
      data: {
        dedup_table_size: 100 * KiB,
      } as Pool,
    });
  });

  it('opens PruneDedupTableDialogComponent when Prune is pressed', () => {
    spectator.setInput('pool', {
      dedup_table_size: 100 * KiB,
    } as Pool);

    spectator.click(spectator.query(byText('Prune'))!);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(PruneDedupTableDialog, {
      data: {
        dedup_table_size: 100 * KiB,
      } as Pool,
    });
  });
});
