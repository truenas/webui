import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { fakeZfsSnapshot } from 'app/pages/datasets/modules/snapshots//testing/snapshot-fake-datasource';
import { SnapshotRollbackDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';

describe('SnapshotRollbackDialogComponent', () => {
  let spectator: Spectator<SnapshotRollbackDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SnapshotRollbackDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: fakeZfsSnapshot.name,
      },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockApi([
        mockCall('zfs.snapshot.query', [fakeZfsSnapshot]),
        mockCall('zfs.snapshot.rollback'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks default messages', () => {
    expect(spectator.fixture.nativeElement).toHaveText('Use snapshot first-snapshot to roll test-dataset back to 2021-10-18 19:51:54?');
    expect(spectator.fixture.nativeElement).toHaveText('Rolling the dataset back destroys data on the dataset');
  });

  it('checks getting additional properties query is called', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.snapshot.query', [[['id', '=', 'test-dataset@first-snapshot']]]);
  });

  it('rollback dataset to selected snapshot when form is submitted and shows a success message', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Stop Rollback if Snapshots Exist:': 'Newer Intermediate, Child, and Clone',
      Confirm: true,
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.snapshot.rollback', [
      'test-dataset@first-snapshot',
      { force: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot first-snapshot.');
  });

  it('checks payload when RollbackRecursiveType.Recursive', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
      'Stop Rollback if Snapshots Exist:': 'Newer Clone',
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.snapshot.rollback', [
      'test-dataset@first-snapshot',
      { force: true, recursive: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot first-snapshot.');
  });

  it('checks payload when RollbackRecursiveType.RecursiveClones', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
      'Stop Rollback if Snapshots Exist:': 'No Safety Check (CAUTION)',
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.snapshot.rollback', [
      'test-dataset@first-snapshot',
      { force: true, recursive_clones: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot first-snapshot.');
  });
});
