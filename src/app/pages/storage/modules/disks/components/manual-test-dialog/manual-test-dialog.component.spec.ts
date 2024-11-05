import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { ManualSmartTest } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { TestProgressRowComponent } from 'app/pages/storage/modules/disks/components/manual-test-dialog/test-progress-row/test-progress-row.component';
import { WebSocketService } from 'app/services/ws.service';
import { ManualTestDialogComponent, ManualTestDialogParams } from './manual-test-dialog.component';

describe('ManualTestDialogComponent', () => {
  let spectator: Spectator<ManualTestDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ManualTestDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(DialogService),
      mockWebSocket([
        mockCall('smart.test.manual_test', [
          { disk: 'sda', expected_result_time: { $date: 1647438105 } },
          { disk: 'sdb', error: 'Disk is on fire.' },
        ] as ManualSmartTest[]),
      ]),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          selectedDisks: [
            { name: 'sda', identifier: 'ID1', serial: 'Serial 1' },
            { name: 'sdb', identifier: 'ID2', serial: 'Serial 2' },
            { name: 'sdc', identifier: 'ID3', serial: 'Serial 3' },
            { name: 'sdd', identifier: 'ID4', serial: 'Serial 4' },
          ] as Disk[],
          diskIdsWithSmart: ['ID1', 'ID2'],
        } as ManualTestDialogParams,
      },
      mockProvider(MatDialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows list of disks that support SMART', () => {
    const supportedDisks = spectator.queryAll('h4');

    expect(supportedDisks[0]).toHaveText('sda (Serial 1)');
    expect(supportedDisks[1]).toHaveText('sdb (Serial 2)');
  });

  it('shows list of disks that do not support SMART', () => {
    const unsupportedMessage = spectator.query(byText('These disks do not support S.M.A.R.T. tests:'));

    const unsupportedDisks = unsupportedMessage.nextElementSibling;

    expect(unsupportedDisks).toHaveText('sdc (Serial 3)');
    expect(unsupportedDisks).toHaveText('sdd (Serial 4)');
  });

  it('starts tests and shows expected finished times and/or errors', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Type: 'SHORT',
    });

    const startButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start' }));
    await startButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'smart.test.manual_test',
      [[
        { identifier: 'ID1', type: SmartTestType.Short },
        { identifier: 'ID2', type: SmartTestType.Short },
      ]],
    );

    const progressComponents = spectator.queryAll(TestProgressRowComponent);
    expect(progressComponents).toHaveLength(2);
  });
});
