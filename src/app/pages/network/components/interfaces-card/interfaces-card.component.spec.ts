import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LinkState, NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { AllNetworkInterfacesUpdate, NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  InterfaceStatusIconComponent,
} from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { InterfacesCardComponent } from 'app/pages/network/components/interfaces-card/interfaces-card.component';
import {
  IpAddressesCellComponent,
} from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesState, InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { NetworkService } from 'app/services/network.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('InterfacesCardComponent', () => {
  let spectator: Spectator<InterfacesCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;
  const interfaces = [
    {
      id: 'eno1',
      name: 'eno1',
      type: NetworkInterfaceType.Physical,
      aliases: [
        { address: '84.23.23.1', netmask: 24, type: NetworkInterfaceAliasType.Inet },
      ],
      state: {
        link_state: LinkState.Up,
      },
    },
    {
      id: 'eno2',
      name: 'eno2',
      type: NetworkInterfaceType.Physical,
      aliases: [],
      state: {
        link_state: LinkState.Down,
      },
    },
    {
      id: 'vlan1',
      name: 'vlan1',
      type: NetworkInterfaceType.Vlan,
      aliases: [],
      state: {
        link_state: LinkState.Unknown,
      },
    },
  ];

  const updateSubject$ = new Subject<AllNetworkInterfacesUpdate>();

  const createComponent = createComponentFactory({
    component: InterfacesCardComponent,
    declarations: [
      IpAddressesCellComponent,
      MockComponent(InterfaceStatusIconComponent),
      IxTableCellDirective,
    ],
    providers: [
      mockProvider(InterfacesStore, {
        loadInterfaces: jest.fn(),
        state$: of({
          interfaces,
          isLoading: false,
        } as InterfacesState),
      }),
      mockWebSocket([
        mockCall('interface.delete'),
      ]),
      mockProvider(NetworkService, {
        subscribeToInOutUpdates: jest.fn(() => updateSubject$),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => ({
          slideInClosed$: of(true),
        } as SlideInRef<unknown>)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    jest.spyOn(spectator.component.interfacesUpdated, 'emit');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('loads network interfaces on init', () => {
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalled();
  });

  it('shows table with network interfaces', async () => {
    expect(await table.getCellTexts()).toEqual([
      ['', 'Name', 'IP Addresses', ''],
      ['', 'eno1', '84.23.23.1/24', ''],
      ['', 'eno2', '', ''],
      ['', 'vlan1', '', ''],
    ]);
  });

  it('shows form to add new interface when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(InterfaceFormComponent);
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('shows form to edit an existing interface when Edit icon is pressed', async () => {
    const editIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'eno1');
    await editIcon.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(InterfaceFormComponent, {
      data: interfaces[0],
    });
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('deletes a network interface with confirmation when Delete icon is pressed', async () => {
    const deleteIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'vlan1');
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Delete Interface',
    }));
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('interface.delete', ['vlan1']);
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('resets a network interface when Reset icon is pressed on a physical interface', async () => {
    const refreshIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'refresh' }), 'eno1');
    await refreshIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Reset Configuration',
    }));
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('interface.delete', ['eno1']);
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('disables Add and Delete buttons on HA systems', async () => {
    spectator.setInput('isHaEnabled', true);

    // Add button
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    expect(await addButton.isDisabled()).toBe(true);

    // Delete button
    const cellButtons = await table.getAllHarnessesInRow(MatButtonHarness, 'vlan1');
    const deleteButton = cellButtons[1];
    expect(await deleteButton.hasHarness(IxIconHarness.with({ name: 'mdi-delete' }))).toBe(true);
    expect(await deleteButton.isDisabled()).toBe(true);
  });

  it('subscribes to updates and shows interface status in first column', () => {
    const someUpdate = {} as NetworkInterfaceUpdate;

    updateSubject$.next({
      eno1: someUpdate,
    });
    spectator.detectChanges();

    const statusIcons = spectator.queryAll(InterfaceStatusIconComponent);
    expect(statusIcons).toHaveLength(3);
    expect(statusIcons[0].update).toEqual(someUpdate);
  });
});
