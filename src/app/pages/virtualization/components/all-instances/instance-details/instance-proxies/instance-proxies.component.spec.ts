import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDeviceType, VirtualizationProxyProtocol } from 'app/enums/virtualization.enum';
import { VirtualizationProxy, VirtualizationUsb } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  InstanceProxiesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxies.component';
import {
  InstanceProxyFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxy-form/instance-proxy-form.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('InstanceProxiesComponent', () => {
  let spectator: Spectator<InstanceProxiesComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceProxiesComponent,
    imports: [

    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('virt.instance.device_delete'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({
          response: true,
          error: false,
        })),
      }),
      mockProvider(VirtualizationInstancesStore, {
        isLoadingDevices: () => false,
        selectedInstance: () => ({ id: 'my-instance' }),
        selectedInstanceDevices: () => [
          {
            dev_type: VirtualizationDeviceType.Usb,
            name: 'Some other device',
          } as VirtualizationUsb,
          {
            name: 'proxy1',
            dev_type: VirtualizationDeviceType.Proxy,
            source_port: 4000,
            source_proto: VirtualizationProxyProtocol.Tcp,
            dest_port: 3000,
            dest_proto: VirtualizationProxyProtocol.Udp,
          } as VirtualizationProxy,
          {
            name: 'proxy2',
            dev_type: VirtualizationDeviceType.Proxy,
            source_port: 5000,
            source_proto: VirtualizationProxyProtocol.Udp,
            dest_port: 5000,
            dest_proto: VirtualizationProxyProtocol.Udp,
          } as VirtualizationProxy,
        ],
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of proxies for the selected instance', () => {
    const proxies = spectator.queryAll('.proxy');

    expect(proxies).toHaveLength(2);
    expect(proxies[0]).toHaveText('4000 TCP (Host) → 3000 UDP (Instance)');
    expect(proxies[1]).toHaveText('5000 UDP (Host) → 5000 UDP (Instance)');
  });

  it('opens a form to add a new proxy when the add button is clicked and reloads the list', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(InstanceProxyFormComponent, false, 'my-instance');
    expect(spectator.inject(VirtualizationInstancesStore).loadDevices).toHaveBeenCalled();
  });

  it('deletes a proxy with confirmation and reloads the list when delete icon is pressed', async () => {
    const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-close' }));
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_delete', ['my-instance', 'proxy1']);
    expect(spectator.inject(VirtualizationInstancesStore).loadDevices).toHaveBeenCalled();
  });
});
