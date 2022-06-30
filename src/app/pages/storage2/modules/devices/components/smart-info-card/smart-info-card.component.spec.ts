import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import {
  ManualTestDialogComponent,
} from 'app/pages/storage2/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { WebSocketService } from 'app/services';
import { SmartInfoCardComponent } from './smart-info-card.component';

describe('SmartInfoCardComponent', () => {
  let spectator: Spectator<SmartInfoCardComponent>;
  let loader: HarnessLoader;
  const disk = {
    identifier: 'disk-1',
  } as Disk;
  const createComponent = createComponentFactory({
    component: SmartInfoCardComponent,
    providers: [
      mockWebsocket([
        mockCall('smart.test.results', [
          {
            disk: 'sdc',
            tests: [
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Running,
              },
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Success,
              },
              {
                lba_of_first_error: 2334,
                status: SmartTestResultStatus.Failed,
              },
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Success,
              },
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Success,
              },
            ],
          } as SmartTestResults,
        ]),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        topologyItem: {
          disk: 'sdc',
        } as VDev,
        disk,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows total number of SMART test results', () => {
    const detailsItem = spectator.query(byText('Total S.M.A.R.T. Test Results:')).parentElement;
    expect(detailsItem).toHaveDescendantWithText({
      selector: '.value',
      text: '4',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.results', [[['disk', '=', 'sdc']]]);
  });

  it('shows a dialog to run a manual SMART test when Run Manual Test is pressed', async () => {
    const runTestButton = await loader.getHarness(MatButtonHarness.with({ text: 'Run Manual Test' }));
    await runTestButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      ManualTestDialogComponent,
      {
        data: {
          selectedDisks: [disk],
          diskIdsWithSmart: ['disk-1'],
        },
      },
    );
  });

  // TODO: handle cases when SMART is not supported
});
