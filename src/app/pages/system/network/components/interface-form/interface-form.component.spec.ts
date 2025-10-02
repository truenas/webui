import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { Store, StoreModule } from '@ngrx/store';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  LacpduRate,
  LinkAggregationProtocol, NetworkInterfaceAliasType,
  NetworkInterfaceType,
  XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DefaultGatewayDialog,
} from 'app/pages/system/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { InterfaceFormComponent } from 'app/pages/system/network/components/interface-form/interface-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { haInfoReducer } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';
import { productTypeLoaded } from 'app/store/system-info/system-info.actions';
import { systemInfoReducer } from 'app/store/system-info/system-info.reducer';
import { systemInfoStateKey } from 'app/store/system-info/system-info.selectors';

describe('InterfaceFormComponent', () => {
  let spectator: Spectator<InterfaceFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let form: IxFormHarness;
  let aliasesList: IxListHarness | null;
  const productType = ProductType.CommunityEdition;

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

  const slideInRef: SlideInRef<NetworkInterface | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: InterfaceFormComponent,
    imports: [
      ReactiveFormsModule,
      IxIpInputWithNetmaskComponent,
      DefaultGatewayDialog,
      StoreModule.forRoot({
        [haInfoStateKey]: haInfoReducer,
        [systemInfoStateKey]: systemInfoReducer,
      }, {
        initialState: {
          [haInfoStateKey]: {
            haStatus: {
              hasHa: true,
              reasons: [],
            },
            isHaLicensed: true,
          },
          [systemInfoStateKey]: {
            systemInfo: null,
            get productType() {
              return productType;
            },
            isIxHardware: false,
            buildYear: 2024,
          },
        },
      }),
    ],
    providers: [
      mockApi([
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
        mockCall('interface.save_default_route'),
        mockCall('network.configuration.update'),
        mockCall('network.general.summary', {
          default_routes: ['1.1.1.1'],
          nameservers: ['8.8.8.8', '8.8.4.4'],
        } as NetworkSummary),
        mockCall('interface.network_config_to_be_removed', { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' }),
        mockCall('failover.licensed', false),
        mockCall('failover.node', 'A'),
        mockCall('failover.config', {
          disabled: true,
        } as FailoverConfig),
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
        getIsHaEnabled: jest.fn(() => of(false)),
      }),
      mockProvider(DialogService),
      mockProvider(SlideIn),
      mockProvider(SystemGeneralService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
      mockProvider(LoaderService, {
        withLoader: () => (source$: unknown) => source$,
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: () => (source$: unknown) => source$,
      }),
      mockProvider(SnackbarService),
    ],
  });

  describe('creation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              interfaces: [{
                ...existingInterface,
                name: 'vlan1',
                type: NetworkInterfaceType.Vlan,
              } as NetworkInterface],
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('auto-generates name when type is changed', async () => {
      await form.fillForm({
        Type: 'Bridge',
      });

      const values = await form.getValues();
      expect(values.Name).toMatch('br1');

      await form.fillForm({
        Type: 'Link Aggregation',
      });

      const updatedValues = await form.getValues();
      expect(updatedValues.Name).toMatch('bond1');

      await form.fillForm({
        Type: 'VLAN',
      });

      const vlanValues = await form.getValues();
      expect(vlanValues.Name).toMatch('vlan2');
    });

    it('saves a new bridge interface when form is submitted for bridge interface', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      const store$ = spectator.inject(Store);
      const dispatchSpy = jest.spyOn(store$, 'dispatch');

      await form.fillForm({
        Type: 'Bridge',
      });
      await aliasesList!.pressAddButton();

      await form.fillForm({
        Name: 'br0',
        Description: 'Bridge interface',
        'Bridge Members': ['enp0s3', 'enp0s4'],
        'IP Address': '10.0.1.2/24',
        'Enable Learning': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('interface.create', [{
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

      expect(dispatchSpy).toHaveBeenCalledWith(networkInterfacesChanged({ commit: false, checkIn: false }));

      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
      jest.spyOn(spectator.inject(MatDialog), 'closeAll');
    });

    it('saves a new link aggregation interface when form is submitted for LAG', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');
      const store$ = spectator.inject(Store);
      const dispatchSpy = jest.spyOn(store$, 'dispatch');

      await form.fillForm(
        {
          Type: 'Link Aggregation',
          Name: 'bond0',
          Description: 'LAG',
          DHCP: 'Get IP Address Automatically from DHCP',
          'Link Aggregation Protocol': 'LACP',
          MTU: 1024,
          'Transmit Hash Policy': 'LAYER2+3',
          'LACPDU Rate': 'SLOW',
          'Link Aggregation Interfaces': ['enp0s3'],
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('interface.create', [{
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

      expect(dispatchSpy).toHaveBeenCalledWith(networkInterfacesChanged({ commit: false, checkIn: false }));

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
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

      expect(api.call).toHaveBeenCalledWith('interface.create', [{
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
      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });

    it('hides Aliases when either DHCP or Autoconfigure IPv6 is enabled', async () => {
      aliasesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Static IP Addresses' }));
      expect(aliasesList).toBeTruthy();

      await form.fillForm({
        DHCP: 'Get IP Address Automatically from DHCP',
      });

      aliasesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Static IP Addresses' }));
      expect(aliasesList).toBeNull();

      await form.fillForm({
        DHCP: 'Define Static IP Addresses',
        'Autoconfigure IPv6': true,
      });

      aliasesList = await loader.getHarnessOrNull(IxListHarness.with({ label: 'Static IP Addresses' }));
      expect(aliasesList).toBeTruthy();
    });

    it('disables save button when HA is enabled', async () => {
      // Fill form with valid data first
      await form.fillForm({
        Type: 'Bridge',
        Name: 'br0',
        Description: 'Test Bridge',
      });

      const networkService = spectator.inject(NetworkService);
      jest.spyOn(networkService, 'getIsHaEnabled').mockReturnValue(of(true));

      spectator.component.ngOnInit();
      spectator.detectChanges();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Reset to HA disabled
      jest.spyOn(networkService, 'getIsHaEnabled').mockReturnValue(of(false));
      spectator.component.ngOnInit();
      spectator.detectChanges();

      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('edit network interface', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => ({ interface: existingInterface }) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('shows values for a network interface when it is opened for edit', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        Name: 'enp0s6',
        DHCP: 'Define Static IP Addresses',
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
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              interface: {
                ...existingInterface,
                id: 'vlan1',
                type: NetworkInterfaceType.Vlan,
              } as NetworkInterface,
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
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
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              interface: {
                ...existingInterface,
                id: 'br7',
                enable_learning: false,
                type: NetworkInterfaceType.Bridge,
              },
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
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
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              interface: {
                ...existingInterface,
                id: 'bond9',
                type: NetworkInterfaceType.LinkAggregation,
              },
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('reloads lag ports when link aggregation is opened for edit', () => {
      expect(spectator.inject(NetworkService).getLaggPortsChoices).toHaveBeenLastCalledWith('bond9');
    });
  });

  describe('failover fields', () => {
    beforeEach(async () => {
      spectator = createComponent({
        detectChanges: false,
      });

      // Dispatch action to set Enterprise product type
      const store$ = spectator.inject(Store);
      store$.dispatch(productTypeLoaded({ productType: ProductType.Enterprise }));

      const websocketMock = spectator.inject(MockApiService);
      websocketMock.mockCall('failover.licensed', true);

      // Trigger ngOnInit which will call loadFailoverStatus
      spectator.component.ngOnInit();
      spectator.detectChanges();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      aliasesList = await loader.getHarness(IxListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('checks whether failover is licensed for', () => {
      expect(api.call).toHaveBeenCalledWith('failover.node');
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

      expect(api.call).toHaveBeenCalledWith('interface.create', [
        expect.objectContaining({
          failover_critical: true,
          failover_group: 1,
        }),
      ]);
      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });

    it('shows Failover Critical and Failover Group when failover is enabled', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      await aliasesList!.pressAddButton();
      await form.fillForm({
        Type: 'Bridge',
        Name: 'br0',
        'IP Address (This Controller)': '10.2.3.4/24',
        'IP Address (TrueNAS Controller 2)': '192.168.1.2',
        'Virtual IP Address (Failover Address)': '192.168.1.3',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('interface.create', [
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
      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });
  });
});
