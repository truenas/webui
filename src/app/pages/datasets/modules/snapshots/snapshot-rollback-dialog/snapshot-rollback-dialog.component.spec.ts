import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SnapshotRollbackDialog } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { fakeZfsSnapshot } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

function snapshotWithCreation(parsedSeconds: number | undefined): ZfsSnapshot {
  return {
    ...fakeZfsSnapshot,
    properties: {
      ...fakeZfsSnapshot.properties,
      creation: { parsed: parsedSeconds as number },
    },
  } as ZfsSnapshot;
}

// `fakeZfsSnapshot.properties.creation.parsed = 1634575914` (unix seconds),
// which the dialog converts to ms and formats via the mocked LocaleService /
// FakeFormatDateTimePipe. Asserting just the wall-clock date keeps coverage
// of "renders a timestamp" without coupling to exact pipe / mock formatting.
const expectedCreationDateFragment = '2021-10-18';

describe('SnapshotRollbackDialog', () => {
  let spectator: Spectator<SnapshotRollbackDialog>;
  let loader: HarnessLoader;

  // Per-test snapshot resolved lazily via useFactory so each test can swap the
  // MAT_DIALOG_DATA value before calling `createComponent()` without needing
  // TestBed.overrideProvider (which fails once the module is instantiated).
  let dialogSnapshot: ZfsSnapshot;

  const createComponent = createComponentFactory({
    component: SnapshotRollbackDialog,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      { provide: MAT_DIALOG_DATA, useFactory: () => dialogSnapshot },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockProvider(ErrorHandlerService),
      mockProvider(LocaleService, {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        toMachineTime: (date: number | Date) => new Date(date),
      }),
      mockApi([
        mockCall('pool.snapshot.query', [snapshotWithCreation(1634575914)]),
        mockCall('pool.snapshot.rollback'),
      ]),
    ],
  });

  beforeEach(() => {
    dialogSnapshot = fakeZfsSnapshot;
  });

  function setupDialog(snapshot: ZfsSnapshot = fakeZfsSnapshot): void {
    dialogSnapshot = snapshot;
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('renders the creation timestamp from the snapshot data without re-querying the API', () => {
    setupDialog();

    expect(spectator.fixture.nativeElement).toHaveText('Use snapshot first-snapshot to roll test-dataset back to');
    expect(spectator.fixture.nativeElement.textContent as string).toContain(expectedCreationDateFragment);
    expect(spectator.fixture.nativeElement).toHaveText('Rolling the dataset back destroys data on the dataset');
    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('pool.snapshot.query', expect.anything());
  });

  it('rollback dataset to selected snapshot when form is submitted and shows a success message', async () => {
    setupDialog();
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Stop Rollback if Snapshots Exist:': 'Newer Intermediate, Child, and Clone',
      Confirm: true,
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshot.rollback', [
      'test-dataset@first-snapshot',
      { force: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot first-snapshot.');
  });

  it('checks payload when RollbackRecursiveType.Recursive', async () => {
    setupDialog();
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
      'Stop Rollback if Snapshots Exist:': 'Newer Clone',
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshot.rollback', [
      'test-dataset@first-snapshot',
      { force: true, recursive: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot first-snapshot.');
  });

  it('omits the datetime fragment when the snapshot data has no creation timestamp, so the dialog does not display 1969', () => {
    setupDialog(snapshotWithCreation(undefined));

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('pool.snapshot.query', expect.anything());
    expect(spectator.fixture.nativeElement).toHaveText('Use snapshot first-snapshot to roll test-dataset back?');
    expect(spectator.fixture.nativeElement).not.toHaveText('1969');
  });

  it('falls back to a pool.snapshot.query when the caller passes a snapshot without properties', () => {
    setupDialog({ ...fakeZfsSnapshot, properties: undefined });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshot.query', [
      [['id', '=', 'test-dataset@first-snapshot']],
      {
        select: ['properties'],
        extra: { properties: ['creation'] },
      },
    ]);
    expect(spectator.fixture.nativeElement.textContent as string).toContain(expectedCreationDateFragment);
  });

  it('closes the dialog when the fallback query errors', () => {
    dialogSnapshot = { ...fakeZfsSnapshot, properties: undefined };
    // detectChanges: false so ngOnInit hasn't fired yet — stub the query to
    // error first, then trigger the single lifecycle pass via detectChanges().
    spectator = createComponent({ detectChanges: false });
    jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(throwError(() => new Error('boom')));

    spectator.detectChanges();

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('closes the dialog when the fallback query returns no snapshot (deleted between list-render and click)', () => {
    dialogSnapshot = { ...fakeZfsSnapshot, properties: undefined };
    // Stub the query to resolve with an empty array (the deleted-between-list-
    // and-click scenario) before the lifecycle runs.
    spectator = createComponent({ detectChanges: false });
    jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of([]));

    spectator.detectChanges();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('closes the dialog when invoked without dialog data', () => {
    dialogSnapshot = undefined as unknown as ZfsSnapshot;
    // detectChanges: false so the template never renders against an undefined
    // snapshot — the single detectChanges() fires ngOnInit, which closes early.
    spectator = createComponent({ detectChanges: false });

    spectator.detectChanges();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('checks payload when RollbackRecursiveType.RecursiveClones', async () => {
    setupDialog();
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
      'Stop Rollback if Snapshots Exist:': 'No Safety Check (CAUTION)',
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.snapshot.rollback', [
      'test-dataset@first-snapshot',
      { force: true, recursive_clones: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot first-snapshot.');
  });
});
