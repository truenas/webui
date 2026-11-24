import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnButtonHarness, TnCheckboxHarness, TnDialog } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of, pipe } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockApi, mockCall, mockQuery } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { SnapshotCloneDialog } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotDetailsRowComponent } from 'app/pages/datasets/modules/snapshots/snapshot-details-row/snapshot-details-row.component';
import { SnapshotRollbackDialog } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { fakeZfsSnapshot } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';

describe('SnapshotDetailsRowComponent', () => {
  let spectator: SpectatorRouting<SnapshotDetailsRowComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  /** The datasets of the snapshot's pool, as `zfs.resource.list` answers with their `origin`. */
  let poolDatasets = [
    { name: 'test-dataset', properties: { origin: { raw: 'none' } } },
  ] as CallResponse<WebUiApiDirectory, 'zfs.resource.list'>;
  /** What `hasRole` answers for `SNAPSHOT_WRITE`. */
  let hasSnapshotWrite = true;

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
      mockApi([
        mockQuery('pool.snapshot.query', [fakeZfsSnapshot as unknown as WebUiQueryEntity<'pool.snapshot.query'>]),
        mockCall('zfs.resource.list', []),
        mockCall('zfs.resource.snapshot.hold', null),
        mockCall('zfs.resource.snapshot.release', null),
        mockCall('zfs.resource.snapshot.destroy', null),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        snapshot: fakeZfsSnapshot,
      },
      detectChanges: false,
    });
    spectator.inject(MockApiService).mockCall('zfs.resource.list', poolDatasets);
    spectator.inject(MockAuthService).hasRole.mockReturnValue(of(hasSnapshotWrite));
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
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
    expect(api.call).toHaveBeenCalledWith('zfs.resource.snapshot.release', [{ path: fakeZfsSnapshot.name }]);
    expect(await holdCheckbox.isChecked()).toBeFalsy();

    await holdCheckbox.toggle();
    expect(api.call).toHaveBeenCalledWith('zfs.resource.snapshot.hold', [{ path: fakeZfsSnapshot.name }]);
  });

  describe('for a user without SNAPSHOT_WRITE', () => {
    beforeAll(() => {
      hasSnapshotWrite = false;
    });

    afterAll(() => {
      hasSnapshotWrite = true;
    });

    it('keeps Hold disabled once the snapshot has loaded', () => {
      // The control rather than the harness: the role wrapper also disables the box, and enabling
      // the control after it had was what put a live Hold in front of a read-only admin.
      expect(api.query).toHaveBeenCalledWith('pool.snapshot.query', expect.anything(), expect.anything());
      expect(spectator.component.holdControl.disabled).toBe(true);
    });
  });

  it('offers Delete for a snapshot nothing was cloned from', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));

    expect(await deleteButton.isDisabled()).toBe(false);
  });

  describe('when a dataset was cloned from the snapshot', () => {
    // Set before the outer `beforeEach` creates the row, which asks once, as it opens.
    const withoutClones = poolDatasets;

    beforeAll(() => {
      poolDatasets = [
        ...withoutClones,
        { name: 'test-dataset-clone', properties: { origin: { raw: fakeZfsSnapshot.name } } },
      ] as CallResponse<WebUiApiDirectory, 'zfs.resource.list'>;
    });

    afterAll(() => {
      poolDatasets = withoutClones;
    });

    it('disables Delete', async () => {
      const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));

      // Found from the clone's side — the dataset whose origin is this snapshot — because neither
      // snapshot query returns a `clones` property.
      expect(api.call).toHaveBeenCalledWith('zfs.resource.list', [{
        paths: ['test-dataset'],
        get_children: true,
        properties: ['origin'],
      }]);
      expect(await deleteButton.isDisabled()).toBe(true);
    });
  });

  it('should delete snapshot when `Delete` button click', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      message: `Delete snapshot ${fakeZfsSnapshot.name}?`,
      call: expect.any(Function),
      successMessage: 'Snapshot deleted.',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.resource.snapshot.destroy', [{ path: 'test-dataset@first-snapshot' }]);
  });
});
