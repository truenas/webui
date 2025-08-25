import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
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
  AutotrimDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/autotrim-dialog/autotrim-dialog.component';
import { StorageHealthCardComponent } from 'app/pages/storage/components/dashboard-pool/storage-health-card/storage-health-card.component';
import {
  VDevsCardComponent,
} from 'app/pages/storage/components/dashboard-pool/vdevs-card/vdevs-card.component';
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
      MockComponent(StorageHealthCardComponent),
      MockComponent(ExportDisconnectModalComponent),
      MockComponent(PoolUsageCardComponent),
      MockComponent(DiskHealthCardComponent),
      MockComponent(VDevsCardComponent),
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

  it('opens a Disconnect/Delete dialog when Disconnect/Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Disconnect/Delete' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ExportDisconnectModalComponent, {
      data: pool,
    });
  });

  it('expands a pool with confirmation when Expand Pool menu item is clicked', async () => {
    // Find and click the Advanced Actions menu trigger
    const menuTrigger = await loader.getHarness(MatButtonHarness.with({
      selector: '[mat-icon-button]',
    }));
    await menuTrigger.click();

    // Find the menu and click the Expand Pool item
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.clickItem({ text: 'Expand Pool' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptextVolumes.expandPoolDialog.title,
      message: helptextVolumes.expandPoolDialog.message,
    });
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.expand', [pool.id]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('opens Auto TRIM dialog when Auto TRIM menu item is clicked', async () => {
    // Find and click the Advanced Actions menu trigger
    const menuTrigger = await loader.getHarness(MatButtonHarness.with({
      selector: '[mat-icon-button]',
    }));
    await menuTrigger.click();

    // Find the menu and click the Auto TRIM item
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.clickItem({ text: 'Auto TRIM' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AutotrimDialog, {
      data: pool,
    });
  });

  it('shows an Upgrade button that upgrades pool with confirmation when pool is not upgraded', async () => {
    const upgradeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upgrade' }));
    await upgradeButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.upgrade', [pool.id]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('shows a Storage Health card for the pool', () => {
    const card = spectator.query(StorageHealthCardComponent)!;
    expect(card).toBeTruthy();
    expect(card.pool).toBe(pool);
  });

  it('shows a disk health card for the pool', () => {
    const card = spectator.query(DiskHealthCardComponent)!;
    expect(card).toBeTruthy();
    expect(card.poolState).toBe(pool);
  });
});
