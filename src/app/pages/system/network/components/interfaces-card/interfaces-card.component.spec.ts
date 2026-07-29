import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LinkState, NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { AllNetworkInterfacesUpdate, NetworkInterfaceReport } from 'app/interfaces/reporting.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  InterfaceStatusIconComponent,
} from 'app/modules/interface-status-icon/interface-status-icon.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { InterfaceFormComponent } from 'app/pages/system/network/components/interface-form/interface-form.component';
import { InterfacesCardComponent } from 'app/pages/system/network/components/interfaces-card/interfaces-card.component';
import {
  IpAddressesCellComponent,
} from 'app/pages/system/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesState, InterfacesStore } from 'app/pages/system/network/stores/interfaces.store';
import { NetworkService } from 'app/services/network.service';

describe('InterfacesCardComponent', () => {
  let spectator: Spectator<InterfacesCardComponent>;
  let loader: HarnessLoader;
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
      description: 'Main NIC',
      type: NetworkInterfaceType.Physical,
      aliases: [] as string[],
      state: {
        link_state: LinkState.Down,
        permanent_link_address: 'ac:1f:6b:ca:32:24',
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
  const failoverConfig$ = new BehaviorSubject({ disabled: true });

  const updateSubject$ = new Subject<AllNetworkInterfacesUpdate>();

  const createComponent = createComponentFactory({
    component: InterfacesCardComponent,
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
      mockProvider(ApiService, {
        call: jest.fn((method) => {
          if (method === 'failover.config') {
            return failoverConfig$;
          }
          return of({});
        }),
      }),
      mockProvider(NetworkService, {
        subscribeToInOutUpdates: jest.fn(() => updateSubject$),
        getIsHaEnabled: jest.fn(() => failoverConfig$.pipe(map((config) => !config.disabled))),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success(true)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockAuth(),
    ],
  });

  async function openRowMenu(rowTag: string): Promise<TnMenuHarness> {
    spectator.click(`[data-test="button-${rowTag}-more-action"]`);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(() => {
    spectator = createComponent();
    jest.spyOn(spectator.component.interfacesUpdated, 'emit');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads network interfaces on init', () => {
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalled();
  });

  it('shows table with network interfaces', async () => {
    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getHeaderTexts()).toEqual(['', 'Name', 'IP Addresses', 'MAC Address', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['', 'eno1', '84.23.23.1/24', '', ''],
      ['', 'eno2 (Main NIC)', '', 'ac:1f:6b:ca:32:24', ''],
      ['', 'vlan1', '', '', ''],
    ]);
  });

  it('sorts interfaces by name when the Name header is clicked', async () => {
    const table = await loader.getHarness(TnTableHarness);
    expect(await table.isSortable('name')).toBe(true);

    await table.clickSortHeader('name'); // ascending
    await table.clickSortHeader('name'); // descending

    expect(await table.getAllRowTexts()).toEqual([
      ['', 'vlan1', '', '', ''],
      ['', 'eno2 (Main NIC)', '', 'ac:1f:6b:ca:32:24', ''],
      ['', 'eno1', '84.23.23.1/24', '', ''],
    ]);
  });

  it('shows form to add new interface when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(InterfaceFormComponent, {
      title: 'Add Interface',
      inputs: { interfacesList: interfaces },
    });
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('shows form to edit an existing interface when Edit icon is pressed', async () => {
    const menu = await openRowMenu('interface-eno1');
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(InterfaceFormComponent, {
      title: 'Edit Interface',
      inputs: { editInterface: interfaces[0] },
    });
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('deletes a network interface with confirmation when Delete icon is pressed', async () => {
    const menu = await openRowMenu('interface-vlan1');
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Interface',
      message: expect.any(String),
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('interface.delete', ['vlan1']);
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('resets a network interface when Reset icon is pressed on a physical interface', async () => {
    const menu = await openRowMenu('interface-eno1');
    await menu.clickItem({ label: 'Reset configuration' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Reset Configuration',
    }));
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('interface.delete', ['eno1']);
    expect(spectator.component.interfacesUpdated.emit).toHaveBeenCalled();
    expect(spectator.inject(InterfacesStore).loadInterfaces).toHaveBeenCalledTimes(2);
  });

  it('disables Add and Delete buttons on HA systems', async () => {
    failoverConfig$.next({ disabled: false });
    spectator.detectChanges();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await addButton.isDisabled()).toBe(true);

    const menu = await openRowMenu('interface-vlan1');
    expect(await menu.isItemDisabled({ label: helptextInterfaces.haEnabledDeleteMessage })).toBe(true);
  });

  it('keeps Reset visible but disabled with an explanatory tooltip on HA systems', async () => {
    failoverConfig$.next({ disabled: false });
    spectator.detectChanges();

    const menu = await openRowMenu('interface-eno1');
    expect(await menu.isItemDisabled({ label: helptextInterfaces.haEnabledResetMessage })).toBe(true);
  });

  it('subscribes to updates and shows interface status in first column', () => {
    const someUpdate = {} as NetworkInterfaceReport;

    updateSubject$.next({
      eno1: someUpdate,
    });
    spectator.detectChanges();

    const statusIcons = spectator.queryAll(InterfaceStatusIconComponent);
    expect(statusIcons).toHaveLength(3);
    expect(statusIcons[0].update).toEqual(someUpdate);
  });
});
