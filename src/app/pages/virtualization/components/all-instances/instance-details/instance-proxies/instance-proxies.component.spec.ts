import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { VirtualizationDeviceType, VirtualizationProxyProtocol } from 'app/enums/virtualization.enum';
import { VirtualizationProxy, VirtualizationUsb } from 'app/interfaces/virtualization.interface';
import {
  InstanceProxiesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxies.component';
import {
  InstanceProxyFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxy-form/instance-proxy-form.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/virtualization/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';

describe('InstanceProxiesComponent', () => {
  let spectator: Spectator<InstanceProxiesComponent>;
  let loader: HarnessLoader;
  const devices = [
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
  ];

  const createComponent = createComponentFactory({
    component: InstanceProxiesComponent,
    imports: [
      MockComponent(DeviceActionsMenuComponent),
    ],
    providers: [
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({
          response: true,
          error: false,
        })),
      }),
      mockProvider(VirtualizationInstancesStore, {
        isLoadingDevices: () => false,
        selectedInstance: () => ({ id: 'my-instance' }),
        selectedInstanceDevices: () => devices,
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

    expect(spectator.inject(ChainedSlideInService).open)
      .toHaveBeenCalledWith(InstanceProxyFormComponent, false, { instanceId: 'my-instance', proxy: undefined });
    expect(spectator.inject(VirtualizationInstancesStore).loadDevices).toHaveBeenCalled();
  });

  it('opens proxy for for edit when actions menu emits (edit)', () => {
    const actionsMenu = spectator.query(DeviceActionsMenuComponent);
    actionsMenu.edit.emit();

    expect(spectator.inject(ChainedSlideInService).open)
      .toHaveBeenCalledWith(InstanceProxyFormComponent, false, { proxy: devices[1], instanceId: 'my-instance' });
  });

  it('renders a button to delete the proxy', () => {
    const deleteButtons = spectator.queryAll(DeviceActionsMenuComponent);
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0].device).toBe(devices[1]);
  });
});
