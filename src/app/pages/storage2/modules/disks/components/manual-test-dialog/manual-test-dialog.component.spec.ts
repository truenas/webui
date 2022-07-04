import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { ManualSmartTest } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { WebSocketService } from 'app/services';
import { ManualTestDialogComponent, ManualTestDialogParams } from './manual-test-dialog.component';

describe('ManualTestDialogComponent', () => {
  let spectator: Spectator<ManualTestDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ManualTestDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => '2022-03-16 14:46:14')),
    ],
    providers: [
      mockWebsocket([
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows list of disks that support SMART', () => {
    const supportedMessage = spectator.query(byText('Run manual test on disks:'));

    const supportedDisks = supportedMessage.nextElementSibling;

    expect(supportedDisks).toHaveText('sda (Serial 1)');
    expect(supportedDisks).toHaveText('sdb (Serial 2)');
  });

  it('shows list of disks that do not support SMART', () => {
    const unsupportedMessage = spectator.query(byText('These disks do not support SMART tests:'));

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
    const tests = spectator.queryAll('.started-tests .test');

    expect(tests[0]).toHaveDescendantWithText({
      selector: '.device-name',
      text: 'sda',
    });
    expect(tests[0]).toHaveText('2022-03-16 14:46:14');

    expect(tests[1]).toHaveDescendantWithText({
      selector: '.device-name',
      text: 'sdb',
    });
    expect(tests[1]).toHaveText('Disk is on fire.');
  });
});
