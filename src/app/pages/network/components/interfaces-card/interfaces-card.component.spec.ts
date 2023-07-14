import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LinkState, NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { AllNetworkInterfacesUpdate, NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import {
  InterfaceStatusIconComponent,
} from 'app/pages/network/components/interfaces-card/interface-status-icon/interface-status-icon.component';
import { InterfacesCardComponent } from 'app/pages/network/components/interfaces-card/interfaces-card.component';
import {
  IpAddressesCellComponent,
} from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesState, InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { DialogService, NetworkService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('InterfacesCardComponent', () => {
  let spectator: Spectator<InterfacesCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;
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
    imports: [
      IxTable2Module,
    ],
    declarations: [
      IpAddressesCellComponent,
      MockComponent(InterfaceStatusIconComponent),
    ],
    providers: [
      mockProvider(InterfacesStore, {
        loadInterfaces: jest.fn(),
        state$: of({
          interfaces,
          isLoading: false,
        } as InterfacesState),
      }),
      mockWebsocket([
        mockCall('interface.delete'),
      ]),
      mockProvider(NetworkService, {
        subscribeToInOutUpdates: jest.fn(() => updateSubject$),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => ({
          slideInClosed$: of(true),
        } as IxSlideInRef<unknown>)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    jest.spyOn(spectator.component.interfacesUpdated, 'emit');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
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

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(InterfaceFormComponent);
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('shows form to edit an existing interface when Edit icon is pressed', async () => {
    const editIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editIcon.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(InterfaceFormComponent, {
      data: interfaces[0],
    });
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('deletes a network interface with confirmation when Delete icon is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 3, 3);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Delete Interface',
    }));
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('interface.delete', ['vlan1']);
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('resets a network interface when Reset icon is pressed on a physical interface', async () => {
    const refreshIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'refresh' }), 1, 3);
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
    const cellButtons = await table.getAllHarnessesInCell(MatButtonHarness, 3, 3);
    const deleteButton = cellButtons[1];
    expect(await deleteButton.hasHarness(IxIconHarness.with({ name: 'delete' }))).toBe(true);
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
    expect(statusIcons[0].update).toBe(someUpdate);
  });
});
