import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDeviceType, VirtualizationProxyProtocol } from 'app/enums/virtualization.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InstanceProxyFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-proxies/instance-proxy-form/instance-proxy-form.component';

describe('InstanceProxyFormComponent', () => {
  let spectator: Spectator<InstanceProxyFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceProxyFormComponent,
    providers: [
      mockApi([
        mockCall('virt.instance.device_add'),
        mockCall('virt.instance.device_update'),
      ]),
      mockProvider(SnackbarService),
    ],
  });

  describe('creating a proxy', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            getData: () => ({
              instanceId: 'my-instance',
            }),
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a title for creating a proxy', () => {
      expect(spectator.query('ix-modal-header')).toHaveText('Add Proxy');
    });

    it('creates a new proxy for the instance provided when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        'Host Port': '2000',
        'Host Protocol': 'TCP',
        'Instance Port': '3000',
        'Instance Protocol': 'UDP',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: true,
        error: false,
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_add', ['my-instance', {
        source_port: 2000,
        source_proto: VirtualizationProxyProtocol.Tcp,
        dest_port: 3000,
        dest_proto: VirtualizationProxyProtocol.Udp,
        dev_type: VirtualizationDeviceType.Proxy,
      }]);
    });
  });

  describe('editing a proxy', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            getData: () => ({
              instanceId: 'my-instance',
              proxy: {
                name: 'my-proxy',
                source_port: 5000,
                source_proto: VirtualizationProxyProtocol.Tcp,
                dest_port: 6000,
                dest_proto: VirtualizationProxyProtocol.Udp,
              },
            }),
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a title for editing a proxy', () => {
      expect(spectator.query('ix-modal-header')).toHaveText('Edit Proxy');
    });

    it('shows values for the proxy that is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Host Port': '5000',
        'Host Protocol': 'TCP',
        'Instance Port': '6000',
        'Instance Protocol': 'UDP',
      });
    });

    it('saves updated proxy when form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Host Port': '5001',
        'Host Protocol': 'UDP',
        'Instance Port': '6001',
        'Instance Protocol': 'UDP',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_update', ['my-instance', {
        name: 'my-proxy',
        source_port: 5001,
        source_proto: VirtualizationProxyProtocol.Udp,
        dest_port: 6001,
        dest_proto: VirtualizationProxyProtocol.Udp,
        dev_type: VirtualizationDeviceType.Proxy,
      }]);

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: true,
        error: false,
      });
    });
  });
});
