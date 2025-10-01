import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { StoreModule } from '@ngrx/store';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IpmiChassisIdentifyState, IpmiIpAddressSource } from 'app/enums/ipmi.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { Ipmi, IpmiChassis } from 'app/interfaces/ipmi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { IpmiFormComponent } from 'app/pages/system/network/components/ipmi-card/ipmi-form/ipmi-form.component';
import { RedirectService } from 'app/services/redirect.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { haInfoReducer } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { systemInfoReducer } from 'app/store/system-info/system-info.reducer';
import { systemInfoStateKey } from 'app/store/system-info/system-info.selectors';

describe('IpmiFormComponent', () => {
  let spectator: Spectator<IpmiFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let productType: ProductType;

  const slideInRef: SlideInRef<number | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: IpmiFormComponent,
    imports: [
      ReactiveFormsModule,
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
      mockProvider(SystemGeneralService),
      mockProvider(RedirectService),
      mockProvider(SlideIn),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(SlideInRef, slideInRef),
      mockApi([
        mockCall('failover.licensed', true),
        mockCall('failover.node', 'A'),
        mockCall('ipmi.lan.query', (params) => {
          if (params?.length ? params[0]['ipmi-options']!['query-remote'] : false) {
            return [{
              channel: 1,
              ip_address_source: IpmiIpAddressSource.Static,
              default_gateway_ip_address: '10.220.0.2',
              id: 1,
              ip_address: '10.220.15.115',
              subnet_mask: '255.255.240.0',
              vlan_id_enable: true,
              vlan_id: 3,
            }] as Ipmi[];
          }

          return [{
            channel: 1,
            ip_address_source: IpmiIpAddressSource.Static,
            default_gateway_ip_address: '10.220.0.1',
            id: 1,
            ip_address: '10.220.15.114',
            subnet_mask: '255.255.240.0',
            vlan_id_enable: true,
            vlan_id: 2,
          }] as Ipmi[];
        }),
        mockCall('ipmi.lan.update', {
          channel: 1,
          ip_address_source: IpmiIpAddressSource.Static,
          default_gateway_ip_address: '10.220.0.2',
          id: 1,
          ip_address: '10.220.15.115',
          subnet_mask: '255.255.240.0',
        } as Ipmi),
        mockCall('ipmi.chassis.info', {
          chassis_identify_state: IpmiChassisIdentifyState.Off,
        } as IpmiChassis),
        mockCall('ipmi.chassis.identify'),
      ]),
      mockAuth(),
    ],
  });

  async function setupTest(newProductType: ProductType): Promise<void> {
    productType = newProductType;
    spectator = createComponent({
      providers: [
        mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => 1) }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  }

  describe('product type is SCALE_ENTERPRISE', () => {
    beforeEach(async () => {
      await setupTest(ProductType.Enterprise);
    });

    it('loads data with controller radio buttons in the form for ScaleEnterprise', async () => {
      const formValue = await form.getValues();

      expect(formValue).toEqual({
        'Remote Controller': 'Active: TrueNAS Controller 1',
        DHCP: false,
        'IPv4 Default Gateway': '10.220.0.1',
        'IPv4 Address': '10.220.15.114',
        'IPv4 Netmask': '255.255.240.0',
        'Enable VLAN': true,
        'VLAN ID': '2',
        Password: '',
      });
    });

    it('loads remote controller data', async () => {
      const remoteController = await loader.getHarness(IxRadioGroupHarness);
      form = await loader.getHarness(IxFormHarness);
      await remoteController.setValue('Standby: TrueNAS Controller 2');
      const formData = await form.getValues();

      expect(formData).toEqual({
        'Remote Controller': 'Standby: TrueNAS Controller 2',
        DHCP: false,
        'IPv4 Address': '10.220.15.115',
        'IPv4 Default Gateway': '10.220.0.2',
        'IPv4 Netmask': '255.255.240.0',
        Password: '',
        'Enable VLAN': true,
        'VLAN ID': '3',
      });
    });

    it('disabled ipaddress, gateway, netmask fields if \'DHCP\' is checked', async () => {
      const checkboxDhcp = await loader.getHarness(IxCheckboxHarness.with({ label: 'DHCP' }));
      await checkboxDhcp.setValue(true);
      const ipaddress = await loader.getHarness(IxInputHarness.with({ label: 'IPv4 Address' }));
      const netmask = await loader.getHarness(IxInputHarness.with({ label: 'IPv4 Netmask' }));
      const gateway = await loader.getHarness(IxInputHarness.with({ label: 'IPv4 Default Gateway' }));

      expect(ipaddress.isDisabled()).toBeTruthy();
      expect(netmask.isDisabled()).toBeTruthy();
      expect(gateway.isDisabled()).toBeTruthy();
    });

    it('updates controller data and closes modal when save is pressed', async () => {
      await form.fillForm({
        'Remote Controller': 'Active: TrueNAS Controller 1',
        DHCP: false,
        'IPv4 Default Gateway': '10.220.0.1',
        'IPv4 Address': '10.220.15.114',
        'IPv4 Netmask': '255.255.240.0',
        'Enable VLAN': true,
        'VLAN ID': '2',
        Password: '',
      });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('ipmi.lan.update', [1, {
        dhcp: false,
        ipaddress: '10.220.15.114',
        gateway: '10.220.0.1',
        netmask: '255.255.240.0',
        vlan: 2,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Successfully saved IPMI settings.');
    });

    it('updates remote controller data and closes modal when save is pressed', async () => {
      await form.fillForm({
        'Remote Controller': 'Standby: TrueNAS Controller 2',
        DHCP: false,
        'IPv4 Address': '10.220.15.115',
        'IPv4 Default Gateway': '10.220.0.2',
        'IPv4 Netmask': '255.255.240.0',
        Password: '',
        'Enable VLAN': true,
        'VLAN ID': '2',
      });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('ipmi.lan.update', [1, {
        dhcp: false,
        ipaddress: '10.220.15.115',
        gateway: '10.220.0.2',
        netmask: '255.255.240.0',
        apply_remote: true,
        vlan: 2,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Successfully saved IPMI settings.');
    });

    it('updates remote controller data and closes modal when save is pressed with vlan disabled', async () => {
      await form.fillForm({
        'Remote Controller': 'Standby: TrueNAS Controller 2',
        DHCP: false,
        'IPv4 Address': '10.220.15.115',
        'IPv4 Default Gateway': '10.220.0.2',
        'IPv4 Netmask': '255.255.240.0',
        Password: '',
        'Enable VLAN': false,
      });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('ipmi.lan.update', [1, {
        dhcp: false,
        ipaddress: '10.220.15.115',
        gateway: '10.220.0.2',
        netmask: '255.255.240.0',
        apply_remote: true,
        vlan: null,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Successfully saved IPMI settings.');
    });
  });

  describe('product type is SCALE', () => {
    beforeEach(async () => {
      await setupTest(ProductType.CommunityEdition);
    });

    it('loads data in the form if the product type is SCALE', async () => {
      const formValue = await form.getValues();

      expect(formValue).toMatchObject({
        DHCP: false,
        'IPv4 Default Gateway': '10.220.0.1',
        'IPv4 Address': '10.220.15.114',
        'IPv4 Netmask': '255.255.240.0',
        'Enable VLAN': true,
        'VLAN ID': '2',
        Password: '',
      });
    });
  });

  describe('IPMI lights', () => {
    beforeEach(async () => {
      await setupTest(ProductType.Enterprise);
    });

    it('flashes IPMI light when Flash Identify Light is pressed', async () => {
      const flashButton = await loader.getHarness(MatButtonHarness.with({ text: 'Flash Identify Light' }));
      await flashButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('ipmi.chassis.identify', [OnOff.On]);
    });

    it('stops flashing IPMI light when Flash Identify Light is pressed again', async () => {
      const flashButton = await loader.getHarness(MatButtonHarness.with({ text: 'Flash Identify Light' }));
      await flashButton.click();
      const stopFlashing = await loader.getHarness(MatButtonHarness.with({ text: 'Stop Flashing' }));
      await stopFlashing.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('ipmi.chassis.identify', [OnOff.Off]);
    });
  });

  describe('VLAN validation', () => {
    beforeEach(async () => {
      await setupTest(ProductType.Enterprise);
    });

    it('does not require VLAN ID when Enable VLAN is false', async () => {
      const enableVlanCheckbox = await form.getControl('Enable VLAN') as IxCheckboxHarness;
      await enableVlanCheckbox.setValue(false);

      expect(spectator.component.form.valid).toBe(true);
      expect(spectator.component.form.controls.vlan_id.hasError('required')).toBe(false);
    });

    it('clears VLAN ID value when Enable VLAN is disabled', async () => {
      // First enable VLAN and set a value
      const enableVlanCheckbox = await form.getControl('Enable VLAN') as IxCheckboxHarness;
      await enableVlanCheckbox.setValue(true);

      const vlanIdInput = await form.getControl('VLAN ID') as IxInputHarness;
      await vlanIdInput.setValue('10');

      // Then disable VLAN
      await enableVlanCheckbox.setValue(false);

      expect(spectator.component.form.controls.vlan_id.value).toBeNull();
    });
  });

  describe('Manage button functionality', () => {
    beforeEach(async () => {
      await setupTest(ProductType.Enterprise);
    });

    it('should be enabled by default with valid static IP', async () => {
      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));

      expect(await manageButton.isDisabled()).toBe(false);
      expect(spectator.component.managementIp).toBe('10.220.15.114');
      expect(spectator.component.isManageButtonDisabled).toBe(false);
    });

    it('should be disabled when IP address is empty', async () => {
      const ipaddressInput = await form.getControl('IPv4 Address') as IxInputHarness;
      await ipaddressInput.setValue('');

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));

      expect(await manageButton.isDisabled()).toBe(true);
      expect(spectator.component.isManageButtonDisabled).toBe(true);
    });

    it('should be disabled when IP address is 0.0.0.0', async () => {
      const ipaddressInput = await form.getControl('IPv4 Address') as IxInputHarness;
      await ipaddressInput.setValue('0.0.0.0');

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));

      expect(await manageButton.isDisabled()).toBe(true);
      expect(spectator.component.isManageButtonDisabled).toBe(true);
    });

    it('should be disabled when IP address is invalid', async () => {
      const ipaddressInput = await form.getControl('IPv4 Address') as IxInputHarness;
      await ipaddressInput.setValue('invalid.ip.address');

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));

      expect(await manageButton.isDisabled()).toBe(true);
      expect(spectator.component.isManageButtonDisabled).toBe(true);
    });

    it('should be enabled with valid IP address in static mode', async () => {
      const ipaddressInput = await form.getControl('IPv4 Address') as IxInputHarness;
      await ipaddressInput.setValue('192.168.1.100');

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));

      expect(await manageButton.isDisabled()).toBe(false);
      expect(spectator.component.managementIp).toBe('192.168.1.100');
      expect(spectator.component.isManageButtonDisabled).toBe(false);
    });

    it('should be enabled with valid IP address when DHCP is enabled', async () => {
      // Enable DHCP first
      const dhcpCheckbox = await form.getControl('DHCP') as IxCheckboxHarness;
      await dhcpCheckbox.setValue(true);

      // Simulate DHCP obtaining an IP address by directly setting form value
      spectator.component.form.controls.ipaddress.setValue('192.168.1.50');
      spectator.component.form.controls.ipaddress.updateValueAndValidity();

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));

      expect(await manageButton.isDisabled()).toBe(false);
      expect(spectator.component.managementIp).toBe('192.168.1.50');
      expect(spectator.component.isManageButtonDisabled).toBe(false);
    });

    it('should update managementIp when IP address changes', async () => {
      const testIp = '10.0.0.100';
      const ipaddressInput = await form.getControl('IPv4 Address') as IxInputHarness;
      await ipaddressInput.setValue(testIp);

      expect(spectator.component.managementIp).toBe(testIp);
    });

    it('should respond to setFormValues updates', () => {
      const mockIpmiData: Ipmi = {
        channel: 1,
        ip_address_source: IpmiIpAddressSource.UseDhcp,
        ip_address: '192.168.1.200',
        default_gateway_ip_address: '192.168.1.1',
        id: 1,
        subnet_mask: '255.255.255.0',
        vlan_id_enable: false,
        vlan_id: null,
      } as Ipmi;

      spectator.component.setFormValues(mockIpmiData);

      expect(spectator.component.managementIp).toBe('192.168.1.200');
      expect(spectator.component.isManageButtonDisabled).toBe(false);
      expect(spectator.component.form.controls.dhcp.value).toBe(true);
    });

    it('should call redirect service when manage button is clicked', async () => {
      const redirectService = spectator.inject(RedirectService);
      const openWindowSpy = jest.spyOn(redirectService, 'openWindow');

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));
      await manageButton.click();

      expect(openWindowSpy).toHaveBeenCalledWith('https://10.220.15.114');
    });
  });

  describe('DHCP to static IP transitions', () => {
    beforeEach(async () => {
      await setupTest(ProductType.Enterprise);
    });

    it('should disable manage button when switching to DHCP with no IP', async () => {
      const dhcpCheckbox = await form.getControl('DHCP') as IxCheckboxHarness;
      await dhcpCheckbox.setValue(true);

      // Clear IP address to simulate initial DHCP state
      spectator.component.form.controls.ipaddress.setValue('');
      spectator.component.form.controls.ipaddress.updateValueAndValidity();

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));

      expect(await manageButton.isDisabled()).toBe(true);
      expect(spectator.component.isManageButtonDisabled).toBe(true);
    });

    it('should enable manage button when DHCP obtains valid IP', async () => {
      // Start with DHCP enabled and no IP
      const dhcpCheckbox = await form.getControl('DHCP') as IxCheckboxHarness;
      await dhcpCheckbox.setValue(true);

      spectator.component.form.controls.ipaddress.setValue('');
      spectator.component.form.controls.ipaddress.updateValueAndValidity();

      let manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));
      expect(await manageButton.isDisabled()).toBe(true);

      // Simulate DHCP obtaining an IP
      spectator.component.form.controls.ipaddress.setValue('10.0.0.50');
      spectator.component.form.controls.ipaddress.updateValueAndValidity();

      manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));
      expect(await manageButton.isDisabled()).toBe(false);
      expect(spectator.component.managementIp).toBe('10.0.0.50');
    });

    it('should maintain button state when switching from DHCP back to static', async () => {
      // Start with DHCP and valid IP
      const dhcpCheckbox = await form.getControl('DHCP') as IxCheckboxHarness;
      await dhcpCheckbox.setValue(true);

      spectator.component.form.controls.ipaddress.setValue('192.168.1.100');
      spectator.component.form.controls.ipaddress.updateValueAndValidity();

      // Switch back to static
      await dhcpCheckbox.setValue(false);

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));
      expect(await manageButton.isDisabled()).toBe(false);
      expect(spectator.component.managementIp).toBe('192.168.1.100');
    });
  });
});
