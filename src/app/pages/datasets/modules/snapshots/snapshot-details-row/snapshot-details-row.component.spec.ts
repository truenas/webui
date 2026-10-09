import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnDialog } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of, pipe } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { SnapshotCloneDialog } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotDetailsRowComponent } from 'app/pages/datasets/modules/snapshots/snapshot-details-row/snapshot-details-row.component';
import { SnapshotRollbackDialog } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { fakeZfsSnapshot } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';

describe('SnapshotDetailsRowComponent', () => {
  let spectator: SpectatorRouting<SnapshotDetailsRowComponent>;
  let loader: HarnessLoader;
  let api: TypedApiService;

  const createComponent = createRoutingFactory({
    component: SnapshotDetailsRowComponent,
    imports: [
      ReactiveFormsModule,
      FileSizePipe,
      FormatDateTimePipe,
      MockComponent(IxDateComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => pipe()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockTypedApi([
        mockTypedQuery('pool.snapshot.query', [fakeZfsSnapshot as unknown as WebUiQueryEntity<'pool.snapshot.query'>]),
        mockTypedQuery('pool.dataset.query', []),
        mockTypedCall('pool.snapshot.hold', null),
        mockTypedCall('pool.snapshot.release', null),
        mockTypedCall('pool.snapshot.delete', null),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        snapshot: fakeZfsSnapshot,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(TypedApiService);
  });

  it('renders details rows', async () => {
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    const rows = spectator.queryAll('.details-row');
    expect(rows).toHaveLength(4);

    expect(rows[0]).toHaveText('Used: 1.49 TiB');
    expect(rows[1]).toHaveText('Date created:');
    expect(spectator.query(IxDateComponent, { parentSelector: '.details-row:nth-child(2)' }).date)
      .toBe(1634575914 * 1000);
    expect(rows[2]).toHaveText('Referenced: 1.49 TiB');
    expect(rows[3]).toHaveText('Retention: Will be automatically destroyed at 2022-06-07 07:25:14 by periodic snapshot task');
  });

  it('should open clone dialog when `Clone To New Dataset` button click', async () => {
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    const cloneButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clone To New Dataset' }));
    await cloneButton.click();

    expect(tnDialog.open).toHaveBeenCalledWith(SnapshotCloneDialog, { data: fakeZfsSnapshot.name });
  });

  it('should open rollback dialog when `Rollback` button click', async () => {
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    const rollbackButton = await loader.getHarness(TnButtonHarness.with({ label: 'Rollback' }));
    await rollbackButton.click();

    // The dialog now accepts the full snapshot so it can render the creation
    // timestamp without a second pool.snapshot.query. By the time the user
    // clicks Rollback, `pool.snapshot.query` (in ngOnInit) has populated
    // `snapshotInfo` with `creation`, so the component passes that through.
    expect(tnDialog.open).toHaveBeenCalledWith(SnapshotRollbackDialog, {
      data: expect.objectContaining({
        name: fakeZfsSnapshot.name,
        properties: expect.objectContaining({
          creation: expect.objectContaining({ parsed: 1634575914 }),
        }),
      }),
    });
  });

  it('should make websocket query when Hold is changed', async () => {
    const holdCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Hold' }));
    expect(await holdCheckbox.isChecked()).toBeTruthy();

    await holdCheckbox.toggle();
    expect(api.call).toHaveBeenCalledWith('pool.snapshot.release', [fakeZfsSnapshot.name]);
    expect(await holdCheckbox.isChecked()).toBeFalsy();

    await holdCheckbox.toggle();
    expect(api.call).toHaveBeenCalledWith('pool.snapshot.hold', [fakeZfsSnapshot.name]);
  });

  it('offers Delete for a snapshot nothing was cloned from', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));

    expect(await deleteButton.isDisabled()).toBe(false);
  });

  it('disables Delete for a snapshot a dataset was cloned from', async () => {
    // Found from the clone's side — the dataset whose origin is this snapshot — because neither
    // snapshot query returns a `clones` property.
    spectator.inject(MockTypedApiService).mockQuery(
      'pool.dataset.query',
      [{ id: 'test-dataset-clone' } as WebUiQueryEntity<'pool.dataset.query'>],
    );
    // The row asks once, as it opens — so it is opened again against the new answer.
    spectator.component.ngOnInit();
    spectator.detectChanges();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));

    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith(
      'pool.dataset.query',
      [['origin.rawvalue', '=', fakeZfsSnapshot.name]],
      { select: ['id'] },
    );
    expect(await deleteButton.isDisabled()).toBe(true);
  });

  it('should delete snapshot when `Delete` button click', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      message: `Delete snapshot ${fakeZfsSnapshot.name}?`,
      call: expect.any(Function),
      successMessage: 'Snapshot deleted.',
    });

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('pool.snapshot.delete', ['test-dataset@first-snapshot']);
  });
});
