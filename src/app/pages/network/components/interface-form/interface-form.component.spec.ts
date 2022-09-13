import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  LacpduRate,
  LinkAggregationProtocol, NetworkInterfaceAliasType,
  NetworkInterfaceType,
  XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { IxListHarness } from 'app/modules/ix-forms/components/ix-list/ix-list.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  DefaultGatewayDialogComponent,
} from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { NetworkService, SystemGeneralService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
      IxFormsModule,
    ],
    declarations: [
      DefaultGatewayDialogComponent,
    ],
    providers: [
      mockWebsocket([
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
      mockProvider(CoreService),
      mockProvider(IxSlideInService),
      mockProvider(SystemGeneralService, {
        getProductType: () => ProductType.ScaleEnterprise,
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Aliases' }));
    ws = spectator.inject(WebSocketService);
  });

  describe('creation', () => {
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
        aliases: [{
          address: '10.0.1.2',
          netmask: 24,
          type: NetworkInterfaceAliasType.Inet,
        }],
        mtu: 1500,
      }]);
      expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
      expect(spectator.inject(CoreService).emit).toHaveBeenCalledWith({
        name: 'NetworkInterfacesChanged',
        data: { commit: false, checkin: false },
        sender: expect.any(InterfaceFormComponent),
      });
      expect(ws.call).toHaveBeenCalledWith('interface.default_route_will_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialogComponent,
        { width: '600px' },
      );
      jest.spyOn(spectator.inject(MatDialog), 'closeAll');
    });

    it('saves a new link aggregation interface when form is submitted for LAG', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      await form.fillForm({
        Type: 'Link Aggregation',
      });
      await form.fillForm({
        Name: 'bond0',
        Description: 'LAG',
        DHCP: true,
        'Link Aggregation Protocol': 'LACP',
        MTU: 1600,
      });
      await form.fillForm({
        'Transmit Hash Policy': 'LAYER2+3',
        'LACPDU Rate': 'SLOW',
        'Link Aggregation Interfaces': ['enp0s3'],
      });

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
        mtu: 1600,
        xmit_hash_policy: XmitHashPolicy.Layer2Plus3,
      }]);
      expect(spectator.inject(CoreService).emit).toHaveBeenCalledWith({
        name: 'NetworkInterfacesChanged',
        data: { commit: false, checkin: false },
        sender: expect.any(InterfaceFormComponent),
      });
      expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
      expect(ws.call).toHaveBeenCalledWith('interface.default_route_will_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialogComponent,
        { width: '600px' },
      );
    });

    it('saves a new VLAN interface when form is submitted for a VLAN', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      await form.fillForm({
        Type: 'VLAN',
      });
      await form.fillForm({
        Name: 'vlan1',
        Description: 'New VLAN',
        'Autoconfigure IPv6': true,
        'Parent Interface': 'enp0s3',
        'VLAN Tag': 2,
        'Priority Code Point': 'Excellent effort',
      });

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
      let aliasesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Aliases' }));
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
      expect(aliasesList).toBeNull();
    });
  });

  describe('edit', () => {
    it('shows values for a network interface when it is opened for edit', async () => {
      spectator.component.setInterfaceForEdit(existingInterface);

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

    it('reloads bridge member choices when bridge interface is opened for edit', () => {
      spectator.component.setInterfaceForEdit({
        ...existingInterface,
        id: 'br7',
        type: NetworkInterfaceType.Bridge,
      });

      expect(spectator.inject(NetworkService).getBridgeMembersChoices).toHaveBeenLastCalledWith('br7');
    });

    it('reloads lag ports when link aggregation is opened for edit', () => {
      spectator.component.setInterfaceForEdit({
        ...existingInterface,
        id: 'bond9',
        type: NetworkInterfaceType.LinkAggregation,
      } as NetworkInterface);

      expect(spectator.inject(NetworkService).getLaggPortsChoices).toHaveBeenLastCalledWith('bond9');
    });

    it('disables parent interface fields when VLAN is opened for edit', async () => {
      spectator.component.setInterfaceForEdit({
        ...existingInterface,
        id: 'vlan1',
        type: NetworkInterfaceType.Vlan,
      } as NetworkInterface);

      const parentInterfaceField = await loader.getHarness(IxSelectHarness.with({ label: 'Parent Interface' }));
      expect(await parentInterfaceField.isDisabled()).toBe(true);
    });
  });

  describe('failover fields', () => {
    beforeEach(() => {
      const mockWebsocket = spectator.inject(MockWebsocketService);
      mockWebsocket.mockCall('failover.licensed', true);
      spectator.component.ngOnInit();
    });

    it('checks whether failover is licensed for', () => {
      expect(ws.call).toHaveBeenCalledWith('failover.licensed');
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
