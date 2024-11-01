import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { Store, StoreModule } from '@ngrx/store';
import { of } from 'rxjs';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  LacpduRate,
  LinkAggregationProtocol, NetworkInterfaceAliasType,
  NetworkInterfaceType,
  XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import {
  DefaultGatewayDialogComponent,
} from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { NetworkService } from 'app/services/network.service';
import { SlideInService } from 'app/services/slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { haInfoReducer } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

describe('InterfaceFormComponent', () => {
  let spectator: Spectator<InterfaceFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let form: IxFormHarness;
  let aliasesList: IxListHarness;
  const existingInterface = {
    id: 'enp0s6',
    name: 'enp0s6',
    type: NetworkInterfaceType.Physical,
    aliases: [{
      type: NetworkInterfaceAliasType.Inet,
      address: '10.2.3.4',
      netmask: 24,
    }],
    description: 'Main NIC',
    ipv4_dhcp: false,
    ipv6_auto: false,
    mtu: 1500,
  } as NetworkInterface;

  const createComponent = createComponentFactory({
    component: InterfaceFormComponent,
    imports: [
      ReactiveFormsModule,
      IxIpInputWithNetmaskComponent,
      DefaultGatewayDialogComponent,
      StoreModule.forRoot({ [haInfoStateKey]: haInfoReducer }, {
        initialState: {
          [haInfoStateKey]: {
            haStatus: {
              hasHa: true,
              reasons: [],
            },
            isHaLicensed: true,
            isUpgradePending: false,
          },
        },
      }),
    ],
    providers: [
      {
        provide: Store,
        useValue: {
          dispatch: jest.fn(),
        },
      },
      mockWebSocket([
        mockCall('interface.xmit_hash_policy_choices', {
          [XmitHashPolicy.Layer2]: XmitHashPolicy.Layer2,
          [XmitHashPolicy.Layer2Plus3]: XmitHashPolicy.Layer2Plus3,
        }),
        mockCall('interface.lacpdu_rate_choices', {
          [LacpduRate.Slow]: LacpduRate.Slow,
          [LacpduRate.Fast]: LacpduRate.Fast,
        }),
        mockCall('interface.create'),
        mockCall('interface.update'),
        mockCall('network.general.summary', {
          default_routes: ['1.1.1.1'],
        } as NetworkSummary),
        mockCall('interface.default_route_will_be_removed', true),
        mockCall('failover.licensed', false),
        mockCall('failover.node', 'A'),
      ]),
      mockProvider(NetworkService, {
        getBridgeMembersChoices: jest.fn(() => of({
          enp0s3: 'enp0s3',
          enp0s4: 'enp0s4',
        })),
        getLaggProtocolChoices: () => of([
          LinkAggregationProtocol.None,
          LinkAggregationProtocol.Lacp,
          LinkAggregationProtocol.LoadBalance,
        ]),
        getLaggPortsChoices: jest.fn(() => of({
          enp0s3: 'enp0s3',
          enp0s4: 'enp0s4',
        })),
        getVlanParentInterfaceChoices: () => of({
          enp0s3: 'enp0s3',
          enp0s4: 'enp0s4',
        }),
        getV4Netmasks: () => [
          { label: '24', value: '24' },
        ],
      }),
      mockProvider(DialogService),
      mockProvider(SlideInService),
      mockProvider(SystemGeneralService, {
        getProductType: () => ProductType.ScaleEnterprise,
      }),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('creation', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Aliases' }));
      ws = spectator.inject(WebSocketService);
    });

    it('saves a new bridge interface when form is submitted for bridge interface', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      await form.fillForm({
        Type: 'Bridge',
      });
      await aliasesList.pressAddButton();

      await form.fillForm({
        Name: 'br0',
        Description: 'Bridge interface',
        'Bridge Members': ['enp0s3', 'enp0s4'],
        'IP Address': '10.0.1.2/24',
        'Enable Learning': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('interface.create', [{
        type: NetworkInterfaceType.Bridge,
        name: 'br0',
        description: 'Bridge interface',
        bridge_members: ['enp0s3', 'enp0s4'],
        ipv4_dhcp: false,
        ipv6_auto: false,
        enable_learning: true,
        aliases: [{
          address: '10.0.1.2',
          netmask: 24,
          type: NetworkInterfaceAliasType.Inet,
        }],
        mtu: 1500,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();

      const store$ = spectator.inject(Store);
      expect(store$.dispatch).toHaveBeenCalledWith(networkInterfacesChanged({ commit: false, checkIn: false }));

      expect(ws.call).toHaveBeenCalledWith('interface.default_route_will_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialogComponent,
        { width: '600px' },
      );
      jest.spyOn(spectator.inject(MatDialog), 'closeAll');
    });

    it('saves a new link aggregation interface when form is submitted for LAG', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      await form.fillForm(
        {
          Type: 'Link Aggregation',
          Name: 'bond0',
          Description: 'LAG',
          DHCP: true,
          'Link Aggregation Protocol': 'LACP',
          MTU: 1024,
          'Transmit Hash Policy': 'LAYER2+3',
          'LACPDU Rate': 'SLOW',
          'Link Aggregation Interfaces': ['enp0s3'],
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('interface.create', [{
        type: NetworkInterfaceType.LinkAggregation,
        name: 'bond0',
        description: 'LAG',
        aliases: [],
        ipv4_dhcp: true,
        ipv6_auto: false,
        lacpdu_rate: LacpduRate.Slow,
        lag_ports: ['enp0s3'],
        lag_protocol: LinkAggregationProtocol.Lacp,
        mtu: 1024,
        xmit_hash_policy: XmitHashPolicy.Layer2Plus3,
      }]);

      const store$ = spectator.inject(Store);
      expect(store$.dispatch).toHaveBeenCalledWith(networkInterfacesChanged({ commit: false, checkIn: false }));

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      expect(ws.call).toHaveBeenCalledWith('interface.default_route_will_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialogComponent,
        { width: '600px' },
      );
    });

    it('saves a new VLAN interface when form is submitted for a VLAN', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');
      await form.fillForm(
        {
          Type: 'VLAN',
          Name: 'vlan1',
          Description: 'New VLAN',
          'Autoconfigure IPv6': true,
          'Parent Interface': 'enp0s3',
          'VLAN Tag': 2,
          'Priority Code Point': 'Excellent effort',
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('interface.create', [{
        type: NetworkInterfaceType.Vlan,
        name: 'vlan1',
        description: 'New VLAN',
        ipv4_dhcp: false,
        ipv6_auto: true,
        vlan_parent_interface: 'enp0s3',
        vlan_pcp: 2,
        vlan_tag: 2,
        mtu: 1500,
        aliases: [],
      }]);
      expect(ws.call).toHaveBeenCalledWith('interface.default_route_will_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialogComponent,
        { width: '600px' },
      );
    });

    it('hides Aliases when either DHCP or Autoconfigure IPv6 is enabled', async () => {
      aliasesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Aliases' }));
      expect(aliasesList).toBeTruthy();

      await form.fillForm({
        DHCP: true,
      });

      aliasesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Aliases' }));
      expect(aliasesList).toBeNull();

      await form.fillForm({
        DHCP: false,
        'Autoconfigure IPv6': true,
      });

      aliasesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Aliases' }));
      expect(aliasesList).toBeTruthy();
    });
  });

  describe('edit network interface', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: existingInterface },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Aliases' }));
      ws = spectator.inject(WebSocketService);
    });

    it('shows values for a network interface when it is opened for edit', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        Name: 'enp0s6',
        DHCP: false,
        'Autoconfigure IPv6': false,
        Description: 'Main NIC',
        MTU: '1500',
        'IP Address': '10.2.3.4/24',
      });
    });
  });

  describe('edit vlan', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              ...existingInterface,
              id: 'vlan1',
              type: NetworkInterfaceType.Vlan,
            } as NetworkInterface,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Aliases' }));
      ws = spectator.inject(WebSocketService);
    });

    it('disables parent interface fields when VLAN is opened for edit', async () => {
      const parentInterfaceField = await loader.getHarness(IxSelectHarness.with({ label: 'Parent Interface' }));
      expect(await parentInterfaceField.isDisabled()).toBe(true);
    });
  });

  describe('edit bridge', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              ...existingInterface,
              id: 'br7',
              enable_learning: false,
              type: NetworkInterfaceType.Bridge,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Aliases' }));
      ws = spectator.inject(WebSocketService);
    });

    it('reloads bridge member choices when bridge interface is opened for edit', () => {
      expect(spectator.inject(NetworkService).getBridgeMembersChoices).toHaveBeenLastCalledWith('br7');
    });

    it('renders Enable Learning for edit', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Enable Learning' }));
      expect(await checkbox.isChecked()).toBe(false);
    });
  });

  describe('edit link aggregation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              ...existingInterface,
              id: 'bond9',
              type: NetworkInterfaceType.LinkAggregation,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Aliases' }));
      ws = spectator.inject(WebSocketService);
    });

    it('reloads lag ports when link aggregation is opened for edit', () => {
      expect(spectator.inject(NetworkService).getLaggPortsChoices).toHaveBeenLastCalledWith('bond9');
    });
  });

  describe('failover fields', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Aliases' }));
      ws = spectator.inject(WebSocketService);
    });

    beforeEach(() => {
      const websocketMock = spectator.inject(MockWebSocketService);
      websocketMock.mockCall('failover.licensed', true);
      spectator.component.ngOnInit();
    });

    it('checks whether failover is licensed for', () => {
      expect(ws.call).toHaveBeenCalledWith('failover.node');
    });

    it('shows and saves additional fields in Aliases when failover is licensed', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      await form.fillForm({
        Type: 'Bridge',
        Name: 'br0',
        Critical: true,
        'Failover Group': '1',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('interface.create', [
        expect.objectContaining({
          failover_critical: true,
          failover_group: 1,
        }),
      ]);
      expect(ws.call).toHaveBeenCalledWith('interface.default_route_will_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialogComponent,
        { width: '600px' },
      );
    });

    it('shows Failover Critical and Failover Group when failover is enabled', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      await aliasesList.pressAddButton();
      await form.fillForm({
        Type: 'Bridge',
        Name: 'br0',
        'IP Address (This Controller)': '10.2.3.4/24',
        'IP Address (TrueNAS Controller 2)': '192.168.1.2',
        'Virtual IP Address (Failover Address)': '192.168.1.3',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('interface.create', [
        expect.objectContaining({
          aliases: [{
            address: '10.2.3.4',
            netmask: 24,
            type: NetworkInterfaceAliasType.Inet,
          }],
          failover_aliases: [{ address: '192.168.1.2' }],
          failover_virtual_aliases: [{ address: '192.168.1.3' }],
        }),
      ]);
      expect(ws.call).toHaveBeenCalledWith('interface.default_route_will_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialogComponent,
        { width: '600px' },
      );
    });
  });
});
