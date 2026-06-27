import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnMenuHarness, TnMenuTesting, TnButtonHarness, TnTableHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { NtpServersCardComponent } from 'app/pages/system/advanced/ntp-servers/ntp-servers-card/ntp-servers-card.component';

const fakeDataSource: NtpServer[] = [
  {
    id: 2,
    address: '2.debian.pool.ntp.org',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  },
  {
    id: 3,
    address: '1.debian.pool.ntp.org',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  },
  {
    id: 10,
    address: '0.debian.pool.ntp.org',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  },
];

describe('NtpServersCardComponent', () => {
  let spectator: Spectator<NtpServersCardComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let formPanel: FormSidePanelService;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: NtpServersCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.ntpserver.query', fakeDataSource),
        mockCall('system.ntpserver.delete', true),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => SlideInResult.cancel()),
      }),
    ],
  });

  async function openFirstRowMenu(): Promise<TnMenuHarness> {
    spectator.click(spectator.query('[data-test$="more-action"]') as HTMLElement);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    formPanel = spectator.inject(FormSidePanelService);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(api.call).toHaveBeenCalledWith('system.ntpserver.query');
    expect(await table.getHeaderTexts()).toEqual(['Address', 'Burst', 'IBurst', 'Prefer', 'Min Poll', 'Max Poll', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['2.debian.pool.ntp.org', 'No', 'Yes', 'No', '6', '10', ''],
      ['1.debian.pool.ntp.org', 'No', 'Yes', 'No', '6', '10', ''],
      ['0.debian.pool.ntp.org', 'No', 'Yes', 'No', '6', '10', ''],
    ]);
  });

  it('opens the Add NTP Server form when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(formPanel.openForm).toHaveBeenCalledWith(expect.anything(), {
      title: 'Add NTP Server',
    });
  });

  it('opens the Edit NTP Server form with the selected row', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(formPanel.openForm).toHaveBeenCalledWith(expect.anything(), {
      title: 'Edit NTP Server',
      editData: fakeDataSource[0],
    });
  });

  it('should display confirm dialog of deleting ntp server', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete NTP Server',
      message: 'Are you sure you want to delete the <b>2.debian.pool.ntp.org</b> NTP Server?',
      call: expect.any(Function),
    });

    expect(api.call).toHaveBeenCalledWith('system.ntpserver.delete', [2]);
  });
});
