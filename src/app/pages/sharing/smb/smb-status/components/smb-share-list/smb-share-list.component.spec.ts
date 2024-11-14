import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { SmbShareInfo } from 'app/interfaces/smb-status.interface';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { SmbShareListComponent } from './smb-share-list.component';

describe('SmbShareListComponent', () => {
  let spectator: Spectator<SmbShareListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const shares = [
    {
      service: 'turtles',
      server_id: {
        pid: '2102401',
        task_id: '0',
        vnn: '4294967295',
        unique_id: '4458796888113407749',
      },
      tcon_id: '1586296247',
      session_id: '1368450234',
      machine: '10.234.16.211',
      connected_at: '2023-10-26T12:17:17.457352+02:00',
      encryption: { cipher: '-', degree: 'none' },
      signing: { cipher: '-', degree: 'none' },
    },
  ] as SmbShareInfo[];

  const createComponent = createComponentFactory({
    component: SmbShareListComponent,
    imports: [
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
    ],
    providers: [mockApi([mockCall('smb.status', shares)])],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Service', 'Session ID', 'Machine', 'Connected at', 'Encryption', 'Signing'],
      ['turtles', '1368450234', '10.234.16.211', '2023-10-26T12:17:17.457352+02:00', '-', '-'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('should call loadData when Refresh button is pressed', async () => {
    jest.spyOn(spectator.component.dataProvider, 'load');
    const refreshButton = await loader.getHarness(MatButtonHarness.with({ text: 'Refresh' }));
    await refreshButton.click();
    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });
});
