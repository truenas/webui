import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { SmbShareInfo } from 'app/interfaces/smb-status.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { SmbShareListComponent } from './smb-share-list.component';

describe('SmbShareListComponent', () => {
  let spectator: Spectator<SmbShareListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

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
      BasicSearchComponent,
    ],
    providers: [
      mockApi([mockCall('smb.status', shares)]),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Service', 'Session ID', 'Machine', 'Connected at', 'Encryption', 'Signing']);
    expect(await table.getAllRowTexts()).toEqual([
      ['turtles', '1368450234', '10.234.16.211', '2023-10-26T12:17:17.457352+02:00', '-', '-'],
    ]);
  });

  it('sorts Encryption by the cipher the cell shows, not by the object behind it', async () => {
    spectator.inject(MockApiService).mockCall('smb.status', [
      { ...shares[0], machine: 'a', encryption: { cipher: 'AES-128-GCM', degree: 'full' } },
      { ...shares[0], machine: 'b', encryption: { cipher: '-', degree: 'none' } },
    ] as SmbShareInfo[]);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);

    await table.clickSortHeader('encryption');

    // The raw value is `{ cipher, degree }`; sorting by it leaves the rows in whatever order
    // lodash makes of two objects. The column's `getValue` gives the cipher to sort by instead.
    expect((await table.getAllRowTexts()).map((row) => row[4])).toEqual(['-', 'AES-128-GCM']);
  });

  it('should call loadData when Refresh button is pressed', async () => {
    jest.spyOn(spectator.component.dataProvider, 'load');
    const refreshButton = await loader.getHarness(TnButtonHarness.with({ label: 'Refresh' }));
    await refreshButton.click();
    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });
});
