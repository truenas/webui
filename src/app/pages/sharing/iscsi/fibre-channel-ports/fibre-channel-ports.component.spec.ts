import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnCardComponent, TnDialog, TnIconButtonHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FibreChannelHost, FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import {
  VirtualPortsNumberDialog,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/virtual-ports-number-dialog/virtual-ports-number-dialog.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { FibreChannelPortsComponent } from './fibre-channel-ports.component';

describe('FibreChannelPortsComponent', () => {
  let spectator: Spectator<FibreChannelPortsComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
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
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
          close: jest.fn(),
        } as unknown as DialogRef)),
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
    table = await loader.getHarness(TnTableHarness);
    store$ = spectator.inject(MockStore);
  });

  it('shows accurate page title', () => {
    // White-box: no TnCardHarness in @truenas/ui-components yet.
    expect(spectator.query(TnCardComponent)!.title()).toBe('Fibre Channel Ports');
  });

  it('should show correct table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Port', 'Target', 'WWPN', 'WWPN (B)', 'State', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['fc0', 'target1', 'naa.220034800d75aec4', 'naa.220034800d75aec5', 'A: Online B: Offline', ''],
      ['– fc0/1 (virtual)', 'target2', 'naa.220034800d75aec8', 'naa.220034800d75aec9', 'A: – B: –', ''],
      ['– fc0/2 (virtual)', '-', '-', '-', 'A: – B: –', ''],
      ['fc1', 'target2', 'naa.220034800d75aec6', 'naa.220034800d75aec7', 'A: Online B: Online', ''],
      ['– fc1/1 (virtual)', '-', '-', '-', 'A: – B: –', ''],
    ]);
  });

  it('shows edit action on physical ports only', async () => {
    // The single visible action renders as an inline tn-icon-button; virtual
    // ports hide it, so only the two physical ports (fc0, fc1) carry a button.
    const editButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-pencil' }));
    expect(editButtons).toHaveLength(2);
  });

  it('opens fibre channel port form when "Edit" button is pressed', async () => {
    const [firstEditButton] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-pencil' }));
    await firstEditButton.click();

    expect(spectator.inject(TnDialog).open)
      .toHaveBeenCalledWith(VirtualPortsNumberDialog, { data: hosts[0] });
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
