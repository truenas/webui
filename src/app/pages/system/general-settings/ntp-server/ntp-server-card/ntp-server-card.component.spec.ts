import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { NtpServerCardComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-card/ntp-server-card.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';

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

describe('NtpServerCardComponent', () => {
  let spectator: Spectator<NtpServerCardComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let slideInRef: SlideIn;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: NtpServerCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.ntpserver.query', fakeDataSource),
        mockCall('system.ntpserver.delete', true),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    slideInRef = spectator.inject(SlideIn);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Address', 'Burst', 'IBurst', 'Prefer', 'Min Poll', 'Max Poll', ''],
      ['2.debian.pool.ntp.org', 'No', 'Yes', 'No', '6', '10', ''],
      ['1.debian.pool.ntp.org', 'No', 'Yes', 'No', '6', '10', ''],
      ['0.debian.pool.ntp.org', 'No', 'Yes', 'No', '6', '10', ''],
    ];

    expect(api.call).toHaveBeenCalledWith('system.ntpserver.query');
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('should open add ntp server form', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(slideInRef.open).toHaveBeenCalledWith(NtpServerFormComponent);
  });

  it('should open edit ntp server form', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 6);
    await editButton.click();

    expect(slideInRef.open).toHaveBeenCalledWith(NtpServerFormComponent, { data: fakeDataSource[0] });
  });

  it('should display confirm dialog of deleting ntp server', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 6);
    await deleteIcon.click();

    expect(api.call).toHaveBeenCalledWith('system.ntpserver.delete', [2]);
  });
});
