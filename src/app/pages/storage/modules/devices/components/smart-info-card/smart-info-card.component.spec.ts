import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestResults, SmartTestTask } from 'app/interfaces/smart-test.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import {
  ManualTestDialogComponent,
} from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { WebSocketService } from 'app/services/ws.service';
import { SmartInfoCardComponent } from './smart-info-card.component';

describe('SmartInfoCardComponent', () => {
  let spectator: Spectator<SmartInfoCardComponent>;
  let loader: HarnessLoader;
  const disk = {
    identifier: 'disk-1',
    togglesmart: true,
    smartoptions: '--some-option',
  } as Disk;
  const createComponent = createComponentFactory({
    component: SmartInfoCardComponent,
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('smart.test.results', [
          {
            disk: 'sdc',
            tests: [
              {
                num: 1,
                status: SmartTestResultStatus.Running,
                description: 'Background short',
              },
              {
                num: 2,
                status: SmartTestResultStatus.Success,
                description: 'Background short',
              },
              {
                num: 3,
                status: SmartTestResultStatus.Failed,
                description: 'Background long',
              },
              {
                num: 4,
                status: SmartTestResultStatus.Success,
                description: 'Background long',
              },
              {
                num: 5,
                status: SmartTestResultStatus.Success,
                description: 'Conveyance',
              },
            ],
          } as SmartTestResults,
        ]),
        mockCall('smart.test.query_for_disk', [
          { id: 1 },
          { id: 2 },
        ] as SmartTestTask[]),
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
        topologyDisk: {
          disk: 'sdc',
        } as TopologyDisk,
        disk,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows total number of SMART test results', () => {
    const detailsItem = spectator.query(byText('Completed S.M.A.R.T. Tests:')).parentElement;
    expect(detailsItem).toHaveDescendantWithText({
      selector: '.value',
      text: '4',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.results', [[['disk', '=', 'sdc']]]);
  });

  it('shows a link to view all smart tests for a disk', () => {
    const link = spectator.query(byText('View All Test Results'));
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/storage/disks/smartresults/disk/sdc');
  });

  it('shows a dialog to run a manual SMART test when Run Manual Test is pressed', async () => {
    spectator.setInput('hasSmartTestSupport', true);

    const runTestButton = await loader.getHarness(MatButtonHarness.with({ text: 'Run Manual Test' }));
    await runTestButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      ManualTestDialogComponent,
      {
        data: {
          selectedDisks: [disk],
          diskIdsWithSmart: ['disk-1'],
        },
        width: '600px',
      },
    );
  });

  it('loads and show last tests in up to 4 categories', () => {
    const resultsByCategory = spectator.query('.results-by-category').children;
    expect(resultsByCategory).toHaveLength(3);

    const category1 = spectator.query(byText('Last Short Test:')).parentElement;
    expect(category1).toHaveDescendantWithText({
      selector: '.value',
      text: 'SUCCESS',
    });

    const category2 = spectator.query(byText('Last Long Test:')).parentElement;
    expect(category2).toHaveDescendantWithText({
      selector: '.value',
      text: 'FAILED',
    });

    const category3 = spectator.query(byText('Last Conveyance Test:')).parentElement;
    expect(category3).toHaveDescendantWithText({
      selector: '.value',
      text: 'SUCCESS',
    });
  });

  it('loads and shows a number of SMART tasks associated with the disk', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.query_for_disk', ['sdc']);

    const detailsItem = spectator.query(byText('S.M.A.R.T. Tasks:')).parentElement;
    expect(detailsItem).toHaveDescendantWithText({
      selector: '.value',
      text: '2 Tasks Configured',
    });
  });

  it('shows a link to manage all smart tasks', () => {
    const link = spectator.query(byText('Manage S.M.A.R.T. Tasks'));
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/data-protection/smart');
  });

  it('tells if SMART is disabled via togglesmart', () => {
    spectator.setInput('disk', {
      ...disk,
      togglesmart: false,
    });

    const detailsItem = spectator.query(byText('S.M.A.R.T. Tasks:')).parentElement;
    expect(detailsItem).toHaveDescendantWithText({
      selector: '.value',
      text: 'Disabled in Disk Settings',
    });
  });

  it('shows SMART options if they are set for the disk', () => {
    const detailsItem = spectator.query(byText('S.M.A.R.T. Options:')).parentElement;
    expect(detailsItem).toHaveDescendantWithText({
      selector: '.value',
      text: '--some-option',
    });
  });

  it('does not show Run Manual Test when disks does not support SMART tests', () => {
    spectator.setInput('hasSmartTestSupport', false);

    const runTestButton = spectator.query(byText('Run Manual Test'));
    expect(runTestButton).not.toExist();
  });
});
