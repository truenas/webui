import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SmartTestResultListComponent } from 'app/pages/storage/modules/disks/components/smart-test-result-list/smart-test-result-list.component';

describe('SmartTestResultListComponent', () => {
  let spectator: Spectator<SmartTestResultListComponent>;
  let table: IxTableHarness;
  let loader: HarnessLoader;

  const smartTestResults: SmartTestResults[] = [{
    disk: 'sda',
    tests: [{
      num: 1,
      description: 'Background long',
      status_verbose: null,
      segment_number: null,
      lifetime: 15959,
      lba_of_first_error: null,
      status: SmartTestResultStatus.Success,
      remaining: null,
      power_on_hours_ago: 1,
    },
    {
      num: 2,
      description: 'Background short',
      status_verbose: 'Completed',
      segment_number: null,
      lifetime: 15929,
      lba_of_first_error: null,
      status: SmartTestResultStatus.Success,
      remaining: 50,
      power_on_hours_ago: 25,
    },
    {
      num: 3,
      description: 'Background short',
      status_verbose: 'Completed',
      segment_number: null,
      lifetime: 16939,
      lba_of_first_error: null,
      status: SmartTestResultStatus.Success,
      remaining: null,
      power_on_hours_ago: 49,
    }],
  }, {
    disk: 'sdb',
    tests: [{
      num: 1,
      description: 'Background long',
      status_verbose: 'Completed',
      segment_number: null,
      lifetime: 15959,
      lba_of_first_error: null,
      status: SmartTestResultStatus.Success,
      remaining: null,
      power_on_hours_ago: 1,
    },
    {
      num: 2,
      description: 'Background short',
      status_verbose: 'Completed',
      segment_number: null,
      lifetime: 15929,
      lba_of_first_error: null,
      status: SmartTestResultStatus.Success,
      remaining: 0.5,
      power_on_hours_ago: 25,
    },
    {
      num: 3,
      description: 'Background short',
      status_verbose: 'Completed',
      segment_number: null,
      lifetime: 16939,
      lba_of_first_error: null,
      status: SmartTestResultStatus.Success,
      remaining: 0,
      power_on_hours_ago: 49,
    }],
  }];

  const disks: Disk[] = [];

  const createComponent = createComponentFactory({
    component: SmartTestResultListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('disk.query', disks),
        mockCall('smart.test.results', smartTestResults),
        mockCall('rsynctask.update'),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Disk', 'Description', 'Status', 'Remaining', expect.stringContaining('Power On Hours Ago'), 'LBA of First Error'],
      ['sda', 'Background long', 'SUCCESS', '0%', '1', 'No errors'],
      ['sda', 'Background short', 'SUCCESS', '50%', '25', 'No errors'],
      ['sda', 'Background short', 'SUCCESS', 'Completed', '49', 'No errors'],
      ['sdb', 'Background long', 'SUCCESS', 'Completed', '1', 'No errors'],
      ['sdb', 'Background short', 'SUCCESS', '0.5%', '25', 'No errors'],
      ['sdb', 'Background short', 'SUCCESS', '0%', '49', 'No errors'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
