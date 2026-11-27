import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { Store, StoreModule } from '@ngrx/store';
import { CallResponse } from '@truenas/api-client';
import {
  TnCheckboxHarness, TnDialog, TnFormListHarness, TnRadioHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import {
  LacpduRate,
  LinkAggregationProtocol, NetworkInterfaceAliasType,
  NetworkInterfaceType,
  XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { TnFormControlHarness } from 'app/modules/forms/ix-forms/testing/tn-form-control.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import {
  DefaultGatewayDialog,
} from 'app/pages/system/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { InterfaceFormComponent } from 'app/pages/system/network/components/interface-form/interface-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { entitlementsLoaded } from 'app/store/entitlements/entitlements.actions';
import { entitlementsReducer } from 'app/store/entitlements/entitlements.reducer';
import { entitlementsStateKey } from 'app/store/entitlements/entitlements.selectors';
import { failoverLicensedStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { haInfoReducer } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';
import { systemInfoReducer } from 'app/store/system-info/system-info.reducer';
import { systemInfoStateKey } from 'app/store/system-info/system-info.selectors';

describe('InterfaceFormComponent', () => {
  let spectator: Spectator<InterfaceFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let aliasesList: TnFormListHarness | null;

  function getField(label: string): Promise<TnFormControlHarness> {
    return loader.getHarness(TnFormControlHarness.with({ label }));
  }

  /** Picks each option in turn, so a multi-select ends up with all of them. */
  async function setSelectValue(label: string, ...options: string[]): Promise<void> {
    const field = await getField(label);
    for (const option of options) {
      await field.setValue(option);
    }
  }

  async function setInputValue(label: string, value: string | number): Promise<void> {
    await (await getField(label)).setValue(value);
  }

  async function getInputValue(label: string): Promise<unknown> {
    return (await getField(label)).getValue();
  }

  async function setCheckbox(label: string, value: boolean): Promise<void> {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label }));
    if (value) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async function setRadioValue(label: string): Promise<void> {
    const radio = await loader.getHarness(TnRadioHarness.with({ label }));
    await radio.check();
  }

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
      DefaultGatewayDialog,
      StoreModule.forRoot({
        [haInfoStateKey]: haInfoReducer,
        [systemInfoStateKey]: systemInfoReducer,
        [entitlementsStateKey]: entitlementsReducer,
      }, {
        initialState: {
          [entitlementsStateKey]: { entitlements: null },
          [haInfoStateKey]: {
            haStatus: {
              hasHa: true,
              reasons: [],
            },
            isHaLicensed: false,
          },
          [systemInfoStateKey]: {
            systemInfo: null,
            entitlementFacts: null,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
      }),
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('interface.xmit_hash_policy_choices', {
          [XmitHashPolicy.Layer2]: XmitHashPolicy.Layer2,
          [XmitHashPolicy.Layer2Plus3]: XmitHashPolicy.Layer2Plus3,
        } as unknown as CallResponse<WebUiApiDirectory, 'interface.xmit_hash_policy_choices'>),
        mockCall('interface.lacpdu_rate_choices', {
          [LacpduRate.Slow]: LacpduRate.Slow,
          [LacpduRate.Fast]: LacpduRate.Fast,
        }),
        mockCall('interface.create', null),
        mockCall('interface.update', null),
        mockCall('network.configuration.update', null),
        mockCall('network.general.summary', {
          default_routes: ['1.1.1.1'],
          nameservers: ['8.8.8.8', '8.8.4.4'],
        } as NetworkSummary),
        mockCall('interface.network_config_to_be_removed', { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' } as unknown as CallResponse<WebUiApiDirectory, 'interface.network_config_to_be_removed'>),
        mockCall('interface.available_fec_modes', []),
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
          LinkAggregationProtocol.Lacp,
          LinkAggregationProtocol.Failover,
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
      mockProvider(SystemGeneralService),
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
    let closedSpy: jest.Mock;

    beforeEach(async () => {
      spectator = createComponent({
        props: {
          interfacesList: [{
            ...existingInterface,
            name: 'vlan1',
            type: NetworkInterfaceType.Vlan,
          } as NetworkInterface],
        },
      });
      closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      aliasesList = await loader.getHarness(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('auto-generates name when type is changed', async () => {
      await setSelectValue('Type', 'Bridge');
      expect(await getInputValue('Name')).toMatch('br1');

      await setSelectValue('Type', 'Link Aggregation');
      expect(await getInputValue('Name')).toMatch('bond1');

      await setSelectValue('Type', 'VLAN');
      expect(await getInputValue('Name')).toMatch('vlan2');
    });

    it('saves a new bridge interface when form is submitted for bridge interface', async () => {
      jest.spyOn(spectator.inject(TnDialog), 'open');

      const store$ = spectator.inject(Store);
      const dispatchSpy = jest.spyOn(store$, 'dispatch');

      await setSelectValue('Type', 'Bridge');
      await aliasesList!.add();

      await setInputValue('Name', 'br0');
      await setInputValue('Description', 'Bridge interface');
      await setSelectValue('Bridge Members', 'enp0s3', 'enp0s4');
      const ipAddress = await loader.getHarness(TnFormControlHarness.with({ label: 'IP Address' }));
      await ipAddress.setValue('10.0.1.2/24');
      await setCheckbox('Enable Learning', true);

      spectator.component.submit();
      await spectator.fixture.whenStable();

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
      expect(closedSpy).toHaveBeenCalledWith(true);

      expect(dispatchSpy).toHaveBeenCalledWith(networkInterfacesChanged({ commit: false, checkIn: false }));

      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });

    it('saves a new link aggregation interface when form is submitted for LAG', async () => {
      jest.spyOn(spectator.inject(TnDialog), 'open');
      const store$ = spectator.inject(Store);
      const dispatchSpy = jest.spyOn(store$, 'dispatch');

      await setSelectValue('Type', 'Link Aggregation');
      await setInputValue('Name', 'bond0');
      await setInputValue('Description', 'LAG');
      await setRadioValue('Get IP Address Automatically from DHCP');
      await setSelectValue('Link Aggregation Protocol', 'LACP');
      await setInputValue('MTU', 1024);
      await setSelectValue('Transmit Hash Policy', 'LAYER2+3');
      await setSelectValue('LACPDU Rate', 'SLOW');
      await setSelectValue('Link Aggregation Interfaces', 'enp0s3');

      spectator.component.submit();
      await spectator.fixture.whenStable();

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

      expect(closedSpy).toHaveBeenCalledWith(true);
      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });

    it('keeps the Save button disabled for a LAG until the required Interfaces field is filled', async () => {
      await setSelectValue('Type', 'Link Aggregation');
      await setInputValue('Name', 'bond0');
      await setSelectValue('Link Aggregation Protocol', 'LACP');
      await setSelectValue('Transmit Hash Policy', 'LAYER2+3');
      await setSelectValue('LACPDU Rate', 'SLOW');

      await spectator.fixture.whenStable();
      expect(spectator.component.canSubmit()).toBe(false);

      await setSelectValue('Link Aggregation Interfaces', 'enp0s3');
      await spectator.fixture.whenStable();
      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('does not let the hidden VLAN fields block Save when the type is changed away from VLAN', async () => {
      await setSelectValue('Type', 'VLAN');
      await spectator.fixture.whenStable();
      expect(spectator.component.canSubmit()).toBe(false);

      await setSelectValue('Type', 'Bridge');
      await spectator.fixture.whenStable();
      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('checks the name against the prefix of the selected type', async () => {
      await setSelectValue('Type', 'Bridge');
      await setInputValue('Name', 'bond1');

      const name = await getField('Name');
      expect(await name.getErrorMessage()).toBe('Bridge interface must start with "br" followed by a unique number');
      expect(spectator.component.canSubmit()).toBe(false);

      await setSelectValue('Type', 'Link Aggregation');
      expect(await name.getErrorMessage()).toBeNull();
    });

    it('checks the VLAN Tag range', async () => {
      await setSelectValue('Type', 'VLAN');
      await setInputValue('VLAN Tag', 5000);

      expect(await (await getField('VLAN Tag')).getErrorMessage())
        .toBe('The value is out of range. Enter a value between 1 and 4094.');
    });

    it('does not let an empty static IP row block Save once DHCP is selected, and drops it', async () => {
      await setSelectValue('Type', 'Bridge');
      await aliasesList!.add();
      await spectator.fixture.whenStable();
      expect(spectator.component.canSubmit()).toBe(false);

      await setRadioValue('Get IP Address Automatically from DHCP');
      await spectator.fixture.whenStable();
      expect(spectator.component.canSubmit()).toBe(true);

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('interface.create', [
        expect.objectContaining({ aliases: [], ipv4_dhcp: true }),
      ]);
    });

    it('rejects a static IP address without a netmask', async () => {
      await aliasesList!.add();
      const ipAddress = await getField('IP Address');
      await ipAddress.setValue('10.0.1.2');

      expect(await ipAddress.getErrorMessage()).toBe('Invalid IP address');
    });

    it('saves a new VLAN interface when form is submitted for a VLAN', async () => {
      jest.spyOn(spectator.inject(TnDialog), 'open');

      await setSelectValue('Type', 'VLAN');
      await setInputValue('Name', 'vlan1');
      await setInputValue('Description', 'New VLAN');
      await setCheckbox('Autoconfigure IPv6', true);
      await setSelectValue('Parent Interface', 'enp0s3');
      await setInputValue('VLAN Tag', 2);
      await setSelectValue('Priority Code Point', 'Excellent effort');

      spectator.component.submit();
      await spectator.fixture.whenStable();

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

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });

    it('hides Aliases when either DHCP or Autoconfigure IPv6 is enabled', async () => {
      aliasesList = await loader.getHarnessOrNull(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      expect(aliasesList).toBeTruthy();

      await setRadioValue('Get IP Address Automatically from DHCP');

      aliasesList = await loader.getHarnessOrNull(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      expect(aliasesList).toBeNull();

      await setRadioValue('Define Static IP Addresses');
      await setCheckbox('Autoconfigure IPv6', true);

      aliasesList = await loader.getHarnessOrNull(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      expect(aliasesList).toBeTruthy();
    });

    it('disables save button when HA is enabled', async () => {
      // Fill form with valid data first
      await setSelectValue('Type', 'Bridge');
      await setInputValue('Name', 'br0');
      await setInputValue('Description', 'Test Bridge');

      const networkService = spectator.inject(NetworkService);
      jest.spyOn(networkService, 'getIsHaEnabled').mockReturnValue(of(true));

      spectator.component.ngOnInit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.canSubmit()).toBe(false);

      // Reset to HA disabled
      jest.spyOn(networkService, 'getIsHaEnabled').mockReturnValue(of(false));
      spectator.component.ngOnInit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.canSubmit()).toBe(true);
    });
  });

  describe('edit network interface', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          editInterface: existingInterface,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      aliasesList = await loader.getHarness(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('shows values for a network interface when it is opened for edit', async () => {
      expect(await getInputValue('Name')).toBe('enp0s6');
      expect(await getInputValue('Description')).toBe('Main NIC');
      expect(await getInputValue('MTU')).toBe('1500');

      const dhcpRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Define Static IP Addresses' }));
      expect(await dhcpRadio.isChecked()).toBe(true);

      const ipv6Auto = await loader.getHarness(TnCheckboxHarness.with({ label: 'Autoconfigure IPv6' }));
      expect(await ipv6Auto.isChecked()).toBe(false);

      const ipAddress = await loader.getHarness(TnFormControlHarness.with({ label: 'IP Address' }));
      expect(await ipAddress.getValue()).toBe('10.2.3.4/24');
    });
  });

  describe('edit with a static IP', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          editInterface: existingInterface,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      aliasesList = await loader.getHarness(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('clears the static IPs when a row is removed and DHCP is selected', async () => {
      const [row] = await aliasesList!.getItems();
      await row.remove();
      await setRadioValue('Get IP Address Automatically from DHCP');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('interface.update', [
        'enp0s6',
        expect.objectContaining({ aliases: [], ipv4_dhcp: true }),
      ]);
    });

    it('keeps the static IPs when only DHCP is selected', async () => {
      await setRadioValue('Get IP Address Automatically from DHCP');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('interface.update', [
        'enp0s6',
        expect.objectContaining({
          aliases: [{ address: '10.2.3.4', netmask: 24, type: NetworkInterfaceAliasType.Inet }],
          ipv4_dhcp: true,
        }),
      ]);
    });
  });

  describe('edit vlan', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          editInterface: {
            ...existingInterface,
            id: 'vlan1',
            type: NetworkInterfaceType.Vlan,
          } as NetworkInterface,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      aliasesList = await loader.getHarness(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('disables parent interface fields when VLAN is opened for edit', async () => {
      expect(await (await getField('Parent Interface')).isDisabled()).toBe(true);
    });
  });

  describe('edit bridge', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          editInterface: {
            ...existingInterface,
            id: 'br7',
            enable_learning: false,
            type: NetworkInterfaceType.Bridge,
          },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      aliasesList = await loader.getHarness(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('reloads bridge member choices when bridge interface is opened for edit', () => {
      expect(spectator.inject(NetworkService).getBridgeMembersChoices).toHaveBeenLastCalledWith('br7');
    });

    it('renders Enable Learning for edit', async () => {
      const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable Learning' }));
      expect(await checkbox.isChecked()).toBe(false);
    });
  });

  describe('bridge loop warning', () => {
    const physicalNics = ['enp0s3', 'enp0s4'].map((name) => ({
      ...existingInterface,
      id: name,
      name,
      type: NetworkInterfaceType.Physical,
    } as NetworkInterface));
    const vlanNic = {
      ...existingInterface, id: 'vlan1', name: 'vlan1', type: NetworkInterfaceType.Vlan,
    } as NetworkInterface;

    const bridgeLoopConfirmation = expect.objectContaining({
      title: 'Possible network loop',
      buttonText: 'Continue',
      cancelText: 'Back to editing',
      hideCheckbox: true,
    });

    function setUp(props: Partial<InterfaceFormComponent>): void {
      spectator = createComponent({ props });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    }

    async function createBridge(...members: string[]): Promise<void> {
      await setSelectValue('Type', 'Bridge');
      await setSelectValue('Bridge Members', ...members);
      spectator.component.submit();
      await spectator.fixture.whenStable();
    }

    it('asks before creating a bridge with two physical members and saves on Continue', async () => {
      setUp({ interfacesList: physicalNics });
      jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of(true));

      await createBridge('enp0s3', 'enp0s4');

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(bridgeLoopConfirmation);
      expect(api.call).toHaveBeenCalledWith('interface.create', [
        expect.objectContaining({ bridge_members: ['enp0s3', 'enp0s4'] }),
      ]);
    });

    it('keeps the form open without saving on Back to editing', async () => {
      setUp({ interfacesList: physicalNics });
      jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of(false));
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      await createBridge('enp0s3', 'enp0s4');

      expect(api.call).not.toHaveBeenCalledWith('interface.create', expect.anything());
      expect(closedSpy).not.toHaveBeenCalled();
      expect(await getInputValue('Bridge Members')).toContain('enp0s4');
    });

    it('does not ask when only one bridge member is physical', async () => {
      setUp({ interfacesList: [physicalNics[0], { ...vlanNic, name: 'enp0s4' } as NetworkInterface] });

      await createBridge('enp0s3', 'enp0s4');

      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
      expect(api.call).toHaveBeenCalledWith('interface.create', expect.anything());
    });

    it('does not ask on an edit that leaves the physical members unchanged', async () => {
      setUp({
        interfacesList: physicalNics,
        editInterface: {
          ...existingInterface,
          id: 'br7',
          name: 'br7',
          type: NetworkInterfaceType.Bridge,
          bridge_members: ['enp0s4', 'enp0s3'],
        } as NetworkInterface,
      });

      await setInputValue('Description', 'Updated');
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
      expect(api.call).toHaveBeenCalledWith('interface.update', ['br7', expect.anything()]);
    });

    it('asks when an edit adds a second physical member', async () => {
      setUp({
        interfacesList: physicalNics,
        editInterface: {
          ...existingInterface,
          id: 'br7',
          name: 'br7',
          type: NetworkInterfaceType.Bridge,
          bridge_members: ['enp0s3'],
        } as NetworkInterface,
      });
      jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of(true));

      await setSelectValue('Bridge Members', 'enp0s4');
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(bridgeLoopConfirmation);
      expect(api.call).toHaveBeenCalledWith('interface.update', [
        'br7',
        expect.objectContaining({ bridge_members: ['enp0s3', 'enp0s4'] }),
      ]);
    });
  });

  describe('edit link aggregation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          editInterface: {
            ...existingInterface,
            id: 'bond9',
            type: NetworkInterfaceType.LinkAggregation,
          },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      aliasesList = await loader.getHarness(TnFormListHarness.with({ label: 'Static IP Addresses' }));
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

      const store$ = spectator.inject(Store);
      store$.dispatch(entitlementsLoaded({ entitlements: {} }));
      store$.dispatch(failoverLicensedStatusLoaded({ isHaLicensed: true }));

      // Trigger ngOnInit which will call loadFailoverStatus
      spectator.component.ngOnInit();
      spectator.detectChanges();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      aliasesList = await loader.getHarness(TnFormListHarness.with({ label: 'Static IP Addresses' }));
      api = spectator.inject(ApiService);
    });

    it('checks whether failover is licensed for', () => {
      expect(api.call).toHaveBeenCalledWith('failover.node');
    });

    it('disables Autoconfigure IPv6 when failover is licensed', async () => {
      const ipv6AutoCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Autoconfigure IPv6' }));
      expect(await ipv6AutoCheckbox.isDisabled()).toBe(true);
      expect(await ipv6AutoCheckbox.isChecked()).toBe(false);
    });

    it('shows and saves additional fields in Aliases when failover is licensed', async () => {
      jest.spyOn(spectator.inject(TnDialog), 'open');

      await setSelectValue('Type', 'Bridge');
      await setInputValue('Name', 'br0');
      await setCheckbox('Critical', true);
      await setSelectValue('Failover Group', '1');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('interface.create', [
        expect.objectContaining({
          failover_critical: true,
          failover_group: 1,
          ipv6_auto: false,
          ipv4_dhcp: false,
        }),
      ]);
      expect(api.call).toHaveBeenCalledWith('interface.network_config_to_be_removed');

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });

    it('shows Failover Critical and Failover Group when failover is enabled', async () => {
      jest.spyOn(spectator.inject(TnDialog), 'open');

      await aliasesList!.add();
      await setSelectValue('Type', 'Bridge');
      await setInputValue('Name', 'br0');

      const ipAddress = await loader.getHarness(
        TnFormControlHarness.with({ label: 'IP Address (This Controller)' }),
      );
      await ipAddress.setValue('10.2.3.4/24');
      await setInputValue('IP Address (TrueNAS Controller 2)', '192.168.1.2');
      await setInputValue('Virtual IP Address (Failover Address)', '192.168.1.3');

      spectator.component.submit();
      await spectator.fixture.whenStable();

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

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        DefaultGatewayDialog,
        {
          width: '600px',
          data: { ipv4gateway: '192.168.1.1', nameserver1: '8.8.8.8', nameserver2: '8.8.4.4' },
        },
      );
    });

    it('drops a row with an incomplete failover address once DHCP is selected', async () => {
      await setSelectValue('Type', 'Bridge');
      await aliasesList!.add();
      const ipAddress = await loader.getHarness(
        TnFormControlHarness.with({ label: 'IP Address (This Controller)' }),
      );
      await ipAddress.setValue('10.2.3.4/24');
      await setInputValue('IP Address (TrueNAS Controller 2)', '10.2.3');
      await setRadioValue('Get IP Address Automatically from DHCP');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('interface.create', [
        expect.objectContaining({ aliases: [], failover_aliases: [], failover_virtual_aliases: [] }),
      ]);
    });
  });

  describe('fec mode when entitled to NETWORK_FEC', () => {
    beforeEach(async () => {
      spectator = createComponent({
        detectChanges: false,
        props: {
          editInterface: {
            ...existingInterface,
            fec_mode: 'auto',
          } as NetworkInterface,
        },
      });

      const store$ = spectator.inject(Store);
      store$.dispatch(entitlementsLoaded({ entitlements: {} }));

      const websocketMock = spectator.inject(MockApiService);
      websocketMock.mockCall('interface.available_fec_modes', ['auto', 'rs', 'baser', 'off']);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('loads available FEC modes for the interface', () => {
      expect(api.call).toHaveBeenCalledWith('interface.available_fec_modes', ['enp0s6']);
    });

    it('shows the FEC Mode dropdown when the interface supports FEC', async () => {
      const fecModeSelect = await loader.getHarnessOrNull(TnFormControlHarness.with({ label: 'FEC Mode' }));
      expect(fecModeSelect).toBeTruthy();
    });

    it('sends fec_mode when saving with FEC support', async () => {
      jest.spyOn(spectator.inject(TnDialog), 'open');

      await setSelectValue('FEC Mode', 'rs');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.canSubmit()).toBe(true);
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('interface.update', [
        'enp0s6',
        expect.objectContaining({
          fec_mode: 'rs',
        }),
      ]);
    });
  });

  describe('fec mode when not entitled to NETWORK_FEC', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          editInterface: existingInterface,
        },
      });

      // Explicitly denied rather than merely unloaded, so this asserts the gate itself.
      spectator.inject(Store).dispatch(entitlementsLoaded({
        entitlements: {
          [EntitlementFeature.NetworkFec]: {
            entitled: false,
            reason: EntitlementReason.KeyMissing,
            message: 'Configuring FEC mode is an enterprise feature.',
          },
        },
      }));
      spectator.detectChanges();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show the FEC Mode dropdown', async () => {
      const fecModeSelect = await loader.getHarnessOrNull(TnFormControlHarness.with({ label: 'FEC Mode' }));
      expect(fecModeSelect).toBeNull();
    });
  });

  describe('fec mode hidden when interface does not support FEC', () => {
    beforeEach(async () => {
      spectator = createComponent({
        detectChanges: false,
        props: {
          editInterface: existingInterface,
        },
      });

      const store$ = spectator.inject(Store);
      store$.dispatch(entitlementsLoaded({ entitlements: {} }));

      const websocketMock = spectator.inject(MockApiService);
      websocketMock.mockCall('interface.available_fec_modes', []);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show FEC Mode when available_fec_modes returns empty array', async () => {
      const fecModeSelect = await loader.getHarnessOrNull(TnFormControlHarness.with({ label: 'FEC Mode' }));
      expect(fecModeSelect).toBeNull();
    });
  });
});
