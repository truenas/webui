import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationDeviceType, VirtualizationProxyProtocol } from 'app/enums/virtualization.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  InstanceProxyFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxy-form/instance-proxy-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('InstanceProxyFormComponent', () => {
  let spectator: Spectator<InstanceProxyFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceProxyFormComponent,
    providers: [
      mockWebSocket([
        mockCall('virt.instance.device_add'),
      ]),
      mockProvider(ChainedRef, {
        getData: () => 'my-instance',
        close: jest.fn(),
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates a new proxy for the instance provided when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      'Host Port': '2000',
      'Host Protocol': 'TCP',
      'Instance Port': '3000',
      'Instance Protocol': 'UDP',
    });

    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({
      response: true,
      error: false,
    });
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('virt.instance.device_add', ['my-instance', {
      source_port: 2000,
      source_proto: VirtualizationProxyProtocol.Tcp,
      dest_port: 3000,
      dest_proto: VirtualizationProxyProtocol.Udp,
      dev_type: VirtualizationDeviceType.Proxy,
    }]);
  });
});
