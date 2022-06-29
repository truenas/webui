import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { Pool } from 'app/interfaces/pool.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DashboardPoolComponent } from 'app/pages/storage2/components/dashboard-pool/dashboard-pool.component';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage2/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { ZfsHealthCardComponent } from 'app/pages/storage2/components/zfs-health-card/zfs-health-card.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

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
    ],
    providers: [
      mockProvider(MatDialog),
      mockProvider(SnackbarService),
      mockProvider(AppLoaderService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebsocket([
        mockJob('pool.expand', fakeSuccessfulJob()),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { pool },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

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
      title: helptext.expand_pool_dialog.title,
      message: helptext.expand_pool_dialog.message,
    });
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('pool.expand', [pool.id]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('shows a ZFS Health card for the pool', () => {
    const card = spectator.query(ZfsHealthCardComponent);
    expect(card).toBeTruthy();
    expect(card.pool).toBe(pool);
  });
});
