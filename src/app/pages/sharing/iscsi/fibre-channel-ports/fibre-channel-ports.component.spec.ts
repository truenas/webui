import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FibreChannelHost, FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  VirtualPortsNumberDialogComponent,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/virtual-ports-number-dialog/virtual-ports-number-dialog.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { FibreChannelPortsComponent } from './fibre-channel-ports.component';

describe('FibreChannelPortsComponent', () => {
  let spectator: Spectator<FibreChannelPortsComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;
  let store$: MockStore;

  const hosts = [
    { alias: 'fc0', npiv: 2 },
    { alias: 'fc1', npiv: 1 },
  ] as FibreChannelHost[];

  const ports = [
    {
      port: 'fc0',
      wwpn: 'naa.220034800d75aec4',
      wwpn_b: 'naa.220034800d75aec5',
      target: {
        id: 1,
        iscsi_target_name: 'target1',
      },
    },
    {
      port: 'fc0/1',
      wwpn: 'naa.220034800d75aec8',
      wwpn_b: 'naa.220034800d75aec9',
      target: {
        id: 2,
        iscsi_target_name: 'target2',
      },
    },
    {
      port: 'fc1',
      wwpn: 'naa.220034800d75aec6',
      wwpn_b: 'naa.220034800d75aec7',
      target: {
        id: 2,
        iscsi_target_name: 'target2',
      },
    },
  ] as FibreChannelPort[];

  const statuses = [
    {
      port: 'fc0',
      A: {
        port_state: 'Online',
      },
      B: {
        port_state: 'Offline',
      },
    },
    {
      port: 'fc1',
      A: {
        port_state: 'Online',
      },
      B: {
        port_state: 'Online',
      },
    },
  ] as FibreChannelStatus[];

  const createComponent = createComponentFactory({
    component: FibreChannelPortsComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('fc.fc_host.query', hosts),
        mockCall('fcport.query', ports),
        mockCall('fcport.status', statuses),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(EmptyService),
      provideMockStore({
        selectors: [{
          selector: selectIsHaLicensed,
          value: true,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
    store$ = spectator.inject(MockStore);
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Fibre Channel Ports');
  });

  it('should show correct table rows', async () => {
    const cells = await table.getCellTexts();
    expect(cells).toEqual([
      ['Port', 'Target', 'WWPN', 'WWPN (B)', 'State', ''],
      ['fc0', 'target1', 'naa.220034800d75aec4', 'naa.220034800d75aec5', 'A: Online B: Offline', ''],
      ['– fc0/1 (virtual)', 'target2', 'naa.220034800d75aec8', 'naa.220034800d75aec9', 'A: – B: –', ''],
      ['– fc0/2 (virtual)', '', '', '', 'A: – B: –', ''],
      ['fc1', 'target2', 'naa.220034800d75aec6', 'naa.220034800d75aec7', 'A: Online B: Online', ''],
      ['– fc1/1 (virtual)', '', '', '', 'A: – B: –', ''],
    ]);
  });

  it('shows edit icon on physical ports only', async () => {
    const firstRowIcons = await table.getAllHarnessesInCell(IxIconHarness, 1, 5);
    const secondRowIcons = await table.getAllHarnessesInCell(IxIconHarness, 2, 5);
    const thirdRowIcons = await table.getAllHarnessesInCell(IxIconHarness, 3, 5);
    const fourthRowIcons = await table.getAllHarnessesInCell(IxIconHarness, 4, 5);
    const fifthRowIcons = await table.getAllHarnessesInCell(IxIconHarness, 5, 5);

    expect(firstRowIcons).toHaveLength(1);
    expect(await firstRowIcons[0].getName()).toBe('edit');
    expect(secondRowIcons).toHaveLength(0);
    expect(thirdRowIcons).toHaveLength(0);
    expect(fourthRowIcons).toHaveLength(1);
    expect(await fourthRowIcons[0].getName()).toBe('edit');
    expect(fifthRowIcons).toHaveLength(0);
  });

  it('opens fibre channel port form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(MatDialog).open)
      .toHaveBeenCalledWith(VirtualPortsNumberDialogComponent, { data: hosts[0] });
  });

  it('should show/hide WWPN (B) column based on HA status', async () => {
    store$.overrideSelector(selectIsHaLicensed, false);
    store$.refreshState();
    spectator.detectChanges();
    spectator.detectComponentChanges();

    const headers = await table.getHeaderTexts();
    expect(headers).not.toContain('WWPN (B)');
  });
});
