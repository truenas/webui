import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { StoreModule } from '@ngrx/store';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IpmiChassisIdentifyState } from 'app/enums/ipmi.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { Ipmi, IpmiChassis } from 'app/interfaces/ipmi.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxRadioGroupHarness } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { IpmiFormComponent } from 'app/pages/network/components/forms/ipmi-form.component';
import {
  DialogService, RedirectService, SystemGeneralService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { haInfoReducer } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';

describe('IpmiFormComponent', () => {
  let spectator: Spectator<IpmiFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let ws: WebSocketService;
  let productType: ProductType;
  const createComponent = createComponentFactory({
    component: IpmiFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      StoreModule.forRoot({ [haInfoStateKey]: haInfoReducer }, {
        initialState: {
          [haInfoStateKey]: {
            haStatus: {
              hasHa: true,
              reasons: [],
            },
            isHaLicensed: true,
            isUpgradePending: false,
            hasOnlyMissmatchVersionsReason: false,
          },
        },
      }),
    ],
    providers: [
      mockProvider(SystemGeneralService, {
        getProductType(): ProductType {
          return productType;
        },
      }),
      mockProvider(RedirectService),
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockWebsocket([
        mockCall('failover.licensed', true),
        mockCall('failover.call_remote', [{
          channel: 1,
          dhcp: false,
          gateway: '10.220.0.2',
          id: 1,
          ipaddress: '10.220.15.115',
          netmask: '255.255.240.0',
          vlan: null,
        }] as Ipmi[]),
        mockCall('failover.node', 'A'),
        mockCall('ipmi.lan.query', [{
          channel: 1,
          dhcp: false,
          gateway: '10.220.0.1',
          id: 1,
          ipaddress: '10.220.15.114',
          netmask: '255.255.240.0',
          vlan: null,
        }] as Ipmi[]),
        mockCall('ipmi.chassis.query', {
          chassis_identify_state: IpmiChassisIdentifyState.Off,
        } as IpmiChassis),
        mockCall('ipmi.chassis.identify'),
      ]),
    ],
  });

  async function setupTest(newProductType: ProductType): Promise<void> {
    productType = newProductType;
    spectator = createComponent();
    spectator.component.setIdIpmi(1);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    ws = spectator.inject(WebSocketService);
  }

  describe('product type is SCALE_ENTERPRISE', () => {
    beforeEach(async () => {
      await setupTest(ProductType.ScaleEnterprise);
    });

    it('loads data with controller radio buttons in the form for ScaleEnterprise', async () => {
      const formValue = await form.getValues();

      expect(formValue).toEqual({
        'Remote Controller': 'Active: TrueNAS Controller 1',
        DHCP: false,
        'IPv4 Default Gateway': '10.220.0.1',
        'IPv4 Address': '10.220.15.114',
        'IPv4 Netmask': '255.255.240.0',
        'VLAN ID': '',
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
        'VLAN ID': '',
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

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const dataForm = {
        'Remote Controller': 'Standby: TrueNAS Controller 2',
        DHCP: false,
        'IPv4 Address': '10.220.15.115',
        'IPv4 Default Gateway': '10.220.0.2',
        'IPv4 Netmask': '255.255.240.0',
        Password: '',
        'VLAN ID': '',
      };
      form = await loader.getHarness(IxFormHarness);
      await form.fillForm(dataForm);
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('failover.call_remote', ['ipmi.lan.update', [1, {
        dhcp: false,
        ipaddress: '10.220.15.115',
        gateway: '10.220.0.2',
        netmask: '255.255.240.0',
        vlan: null,
      }]]);
      expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Successfully saved IPMI settings.');
    });
  });

  describe('product type is SCALE', () => {
    beforeEach(async () => {
      await setupTest(ProductType.Scale);
    });

    it('loads data in the form if the product type is SCALE', async () => {
      const formValue = await form.getValues();

      expect(formValue).toEqual({
        DHCP: false,
        'IPv4 Default Gateway': '10.220.0.1',
        'IPv4 Address': '10.220.15.114',
        'IPv4 Netmask': '255.255.240.0',
        'VLAN ID': '',
        Password: '',
      });
    });
  });

  describe('IPMI lights', () => {
    beforeEach(async () => {
      await setupTest(ProductType.ScaleEnterprise);
    });

    it('flashes IPMI light when Flash Identify Light is pressed', async () => {
      const flashButton = await loader.getHarness(MatButtonHarness.with({ text: 'Flash Identify Light' }));
      await flashButton.click();

      expect(ws.call).toHaveBeenLastCalledWith('ipmi.chassis.identify', [OnOff.On]);
    });

    it('stops flashing IPMI light when Flash Identify Light is pressed again', async () => {
      const flashButton = await loader.getHarness(MatButtonHarness.with({ text: 'Flash Identify Light' }));
      await flashButton.click();
      const stopFlashing = await loader.getHarness(MatButtonHarness.with({ text: 'Stop Flashing' }));
      await stopFlashing.click();

      expect(ws.call).toHaveBeenLastCalledWith('ipmi.chassis.identify', [OnOff.Off]);
    });
  });
});
