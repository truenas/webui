import { MatDialog } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Zpool } from 'app/interfaces/zpool.interface';
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
          properties: {
            dedup_table_quota: { raw: 'auto', source: null, value: 'auto' },
            dedup_table_size: { raw: String(100 * KiB), source: null, value: 100 * KiB },
          },
        } as unknown as Zpool,
      },
    });
  });

  it('shows deduplication stats for various quota settings', () => {
    // Auto
    spectator.setInput('pool', {
      properties: {
        dedup_table_quota: { raw: 'auto', source: null, value: 'auto' },
        dedup_table_size: { raw: String(100 * KiB), source: null, value: 100 * KiB },
      },
    } as unknown as Zpool);
    expect(spectator.query(byText('Deduplication Table:'))!.parentElement!.querySelector('.value')).toHaveText('100 KiB');

    // Custom
    spectator.setInput('pool', {
      properties: {
        dedup_table_quota: { raw: String(200 * KiB), source: null, value: String(200 * KiB) },
        dedup_table_size: { raw: String(100 * KiB), source: null, value: 100 * KiB },
      },
    } as unknown as Zpool);
    expect(spectator.query(byText('Deduplication Table:'))!.parentElement!.querySelector('.value')).toHaveText('100 KiB / 200 KiB');

    // None
    spectator.setInput('pool', {
      properties: {
        dedup_table_quota: { raw: '0', source: null, value: '0' },
        dedup_table_size: { raw: String(100 * KiB), source: null, value: 100 * KiB },
      },
    } as unknown as Zpool);
    expect(spectator.query(byText('Deduplication Table:'))!.parentElement!.querySelector('.value')).toHaveText('100 KiB');
  });

  it('opens SetDedupQuotaComponent when Set Quota is pressed', () => {
    const pool = {
      properties: {
        dedup_table_size: { raw: String(100 * KiB), source: null, value: 100 * KiB },
      },
    } as unknown as Zpool;
    spectator.setInput('pool', pool);

    spectator.click(spectator.query(byText('Set Quota'))!);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SetDedupQuotaComponent, {
      data: pool,
    });
  });

  it('opens PruneDedupTableDialogComponent when Prune is pressed', () => {
    const pool = {
      properties: {
        dedup_table_size: { raw: String(100 * KiB), source: null, value: 100 * KiB },
      },
    } as unknown as Zpool;
    spectator.setInput('pool', pool);

    spectator.click(spectator.query(byText('Prune'))!);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(PruneDedupTableDialog, {
      data: pool,
    });
  });

  it('hides Prune link when dedup table is empty', () => {
    spectator.setInput('pool', {
      properties: {
        dedup_table_quota: { raw: 'auto', source: null, value: 'auto' },
        dedup_table_size: { raw: '0', source: null, value: 0 },
      },
    } as unknown as Zpool);

    expect(spectator.query(byText('Prune'))).not.toExist();
    expect(spectator.query(byText('Set Quota'))).toExist();
  });
});
