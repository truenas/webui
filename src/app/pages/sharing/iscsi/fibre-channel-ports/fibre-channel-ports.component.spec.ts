import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { FibreChannelPortsFormComponent } from 'app/pages/sharing/iscsi/fibre-channel-ports-form/fibre-channel-ports-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { FibreChannelPortsComponent } from './fibre-channel-ports.component';

describe('FibreChannelPortsComponent', () => {
  let spectator: Spectator<FibreChannelPortsComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;
  let store$: MockStore;

  const mockFibreChannelPort = {
    id: 1,
    port: 'fc1',
    wwpn: '10:00:00:00:00:00:00:01',
    wwpn_b: '10:00:00:00:00:00:00:02',
    target: {
      id: 1,
      iscsi_target_name: 'target1',
    },
  } as FibreChannelPort;

  const mockFcStatus = [
    {
      port: 'fc0',
      A: {
        port_type: 'INITIATOR',
        port_state: 'ONLINE',
        speed: '16Gb',
        physical: true,
        wwpn: '10:00:00:00:00:00:00:01',
      },
      B: {
        port_type: 'INITIATOR',
        port_state: 'OFFLINE',
        speed: '16Gb',
        physical: true,
        wwpn: '10:00:00:00:00:00:00:02',
      },
    },
    {
      port: 'fc1',
      A: {
        port_type: 'TARGET',
        port_state: 'ONLINE',
        speed: '32Gb',
        physical: true,
        wwpn: '20:00:00:00:00:00:00:01',
      },
      B: {
        port_type: 'TARGET',
        port_state: 'ONLINE',
        speed: '32Gb',
        physical: true,
        wwpn: '20:00:00:00:00:00:00:02',
      },
    },
  ];

  const createComponent = createComponentFactory({
    component: FibreChannelPortsComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('fcport.query', [mockFibreChannelPort]),
        mockCall('fcport.delete'),
        mockCall('fcport.status', mockFcStatus as FibreChannelStatus[]),
      ]),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(SlideInRef, {
        slideInClosed$: of(true),
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
    const expectedRows = [
      ['Port', 'Target', 'WWPN', 'WWPN (B)', 'State', ''],
      [
        'fc1',
        'target1',
        '10:00:00:00:00:00:00:01',
        '10:00:00:00:00:00:00:02',
        'A:ONLINE B:ONLINE',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens fibre channel port form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(SlideInService).open)
      .toHaveBeenCalledWith(FibreChannelPortsFormComponent, { data: mockFibreChannelPort });
  });

  it('opens confirmation dialog when Delete is clicked and deletes the port when confirmed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete Fibre Channel Port',
      message: 'Are you sure you want to delete Fibre Channel Port fc1?',
      buttonText: 'Delete',
      cancelText: 'Cancel',
    });
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.delete', [1]);
  });

  it('should load data on init', () => {
    const apiService = spectator.inject(ApiService);
    expect(apiService.call).toHaveBeenCalledWith('fcport.query');
  });

  it('should show/hide WWPN (B) column based on HA status', async () => {
    store$.overrideSelector(selectIsHaLicensed, false);
    store$.refreshState();
    spectator.detectChanges();
    spectator.detectComponentChanges();

    const headers = await table.getHeaderTexts();
    expect(headers).not.toContain('WWPN (B)');
  });

  it('should show correct state from status data', async () => {
    const cells = await table.getCellTexts();
    expect(cells[1][4]).toBe('A:ONLINE B:ONLINE');
  });
});
