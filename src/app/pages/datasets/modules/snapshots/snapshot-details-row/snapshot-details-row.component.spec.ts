import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnapshotCloneDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotDetailsRowComponent } from 'app/pages/datasets/modules/snapshots/snapshot-details-row/snapshot-details-row.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { fakeZfsSnapshot } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SnapshotDetailsRowComponent', () => {
  let spectator: SpectatorRouting<SnapshotDetailsRowComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createRoutingFactory({
    component: SnapshotDetailsRowComponent,
    imports: [
      AppLoaderModule,
      IxFormsModule,
      IxTableModule,
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(AppLoaderService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebsocket([
        mockCall('zfs.snapshot.query', [fakeZfsSnapshot]),
        mockCall('zfs.snapshot.delete'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        snapshot: fakeZfsSnapshot,
        colspan: 5,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('checks colspan attribute', () => {
    expect(spectator.query('td').getAttribute('colspan')).toBe('5');
  });

  it('renders details rows', () => {
    const rows = spectator.queryAll('.details-row');
    expect(rows).toHaveLength(4);

    expect(rows[0]).toHaveText('Used: 1.49 TiB');
    expect(rows[1]).toHaveText('Date created: 2021-10-18 19:51:54');
    expect(rows[2]).toHaveText('Referenced: 1.49 TiB');
    expect(rows[3]).toHaveText('Retention: Will be automatically destroyed at 2022-06-07 07:25:14 by periodic snapshot task');
  });

  it('should open clone dialog when `Clone To New Dataset` button click', async () => {
    const matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();

    const cloneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clone To New Dataset' }));
    await cloneButton.click();

    expect(matDialog.open).toHaveBeenCalledWith(SnapshotCloneDialogComponent, { data: fakeZfsSnapshot.name });
  });

  it('should open rollback dialog when `Rollback` button click', async () => {
    const matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(matDialog.open).toHaveBeenCalledWith(SnapshotRollbackDialogComponent, { data: fakeZfsSnapshot.name });
  });

  it('should delete snapshot when `Delete` button click', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete',
        message: `Delete snapshot ${fakeZfsSnapshot.name}?`,
      }),
    );
    expect(ws.call).toHaveBeenNthCalledWith(2, 'zfs.snapshot.delete', [fakeZfsSnapshot.name]);
  });
});
