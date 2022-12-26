import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { fakeZfsSnapshot } from 'app/pages/datasets/modules/snapshots//testing/snapshot-fake-datasource';
import { SnapshotRollbackDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

describe('SnapshotRollbackDialogComponent', () => {
  let spectator: Spectator<SnapshotRollbackDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SnapshotRollbackDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => '2021-11-05 10:52:06')),
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: fakeZfsSnapshot.name,
      },
      mockProvider(AppLoaderService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
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
    expect(spectator.fixture.nativeElement).toHaveText('Use snapshot first-snapshot to roll test-dataset back to 2021-11-05 10:52:06?');
    expect(spectator.fixture.nativeElement).toHaveText('Rolling the dataset back destroys data on the dataset');
  });

  it('checks getting additional properties query is called', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.query', [[['id', '=', 'test-dataset@first-snapshot']]]);
  });

  it('rollback dataset to selected snapshot when form is submitted and shows a success message', async () => {
    // TODO: Check when NAS-114799 is done
    // Add test for different recursive values

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.rollback', [
      'test-dataset@first-snapshot',
      { force: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot first-snapshot.');
  });
});
