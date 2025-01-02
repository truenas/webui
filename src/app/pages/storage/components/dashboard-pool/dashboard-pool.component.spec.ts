import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DashboardPoolComponent } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.component';
import { DiskHealthCardComponent } from 'app/pages/storage/components/dashboard-pool/disk-health-card/disk-health-card.component';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import {
  PoolUsageCardComponent,
} from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.component';
import {
  TopologyCardComponent,
} from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';
import { ZfsHealthCardComponent } from 'app/pages/storage/components/dashboard-pool/zfs-health-card/zfs-health-card.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';

describe('DashboardPoolComponent', () => {
  let spectator: Spectator<DashboardPoolComponent>;
  let loader: HarnessLoader;
  const pool = {
    name: 'deadpool',
    id: 4,
  } as Pool;
  const createComponent = createComponentFactory({
    component: DashboardPoolComponent,
    declarations: [
      MockComponent(ZfsHealthCardComponent),
      MockComponent(ExportDisconnectModalComponent),
      MockComponent(PoolUsageCardComponent),
      MockComponent(DiskHealthCardComponent),
      MockComponent(TopologyCardComponent),
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => ({ afterClosed: jest.fn(() => of()) })),
      }),
      mockProvider(SnackbarService),
      mockProvider(PoolsDashboardStore, {
        loadDashboard: jest.fn(),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('disk.query', []),
        mockCall('pool.upgrade'),
        mockJob('pool.expand', fakeSuccessfulJob()),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(fakeAsync(() => {
    spectator = createComponent({
      props: {
        pool,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    tick();
    spectator.detectChanges();
    flush();
  }));

  it('shows pool name', () => {
    expect(spectator.query('.pool-name')).toHaveText('deadpool');
  });

  it('opens an Export/Disconnect dialog when corresponding button is pressed', async () => {
    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export/Disconnect' }));
    await exportButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ExportDisconnectModalComponent, {
      data: pool,
    });
  });

  it('expands a pool with confirmation when Expand button is pressed', async () => {
    const expandButton = await loader.getHarness(MatButtonHarness.with({ text: 'Expand' }));
    await expandButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptextVolumes.expand_pool_dialog.title,
      message: helptextVolumes.expand_pool_dialog.message,
    });
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.expand', [pool.id]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('shows an Upgrade button that upgrades pool with confirmation when pool is not upgraded', async () => {
    const upgradeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upgrade' }));
    await upgradeButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.upgrade', [pool.id]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('shows a ZFS Health card for the pool', () => {
    const card = spectator.query(ZfsHealthCardComponent)!;
    expect(card).toBeTruthy();
    expect(card.pool).toBe(pool);
  });

  it('shows a disk health card for the pool', () => {
    const card = spectator.query(DiskHealthCardComponent)!;
    expect(card).toBeTruthy();
    expect(card.poolState).toBe(pool);
  });
});
