import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationDisk, VirtualizationProxy } from 'app/interfaces/virtualization.interface';
import {
  InstanceDiskFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disk-form/instance-disk-form.component';
import {
  InstanceDisksComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/virtualization/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { SlideIn } from 'app/services/slide-in';

describe('InstanceDisksComponent', () => {
  let spectator: Spectator<InstanceDisksComponent>;
  let loader: HarnessLoader;
  const disks = [
    {
      dev_type: VirtualizationDeviceType.Disk,
      source: '/mnt/source-path',
      destination: 'destination',
    } as VirtualizationDisk,
    {
      dev_type: VirtualizationDeviceType.Disk,
      source: null,
      destination: 'destination',
    } as VirtualizationDisk,
    {
      name: 'proxy2',
    } as VirtualizationProxy,
  ];
  const createComponent = createComponentFactory({
    component: InstanceDisksComponent,
    imports: [
      MockComponent(DeviceActionsMenuComponent),
    ],
    providers: [
      mockProvider(VirtualizationDevicesStore, {
        isLoading: () => false,
        selectedInstance: () => ({ id: 'my-instance' }),
        devices: () => disks,
        loadDevices: jest.fn(),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of disks that have source set', () => {
    const diskRows = spectator.queryAll('.disk');

    expect(diskRows).toHaveLength(1);
    expect(diskRows[0]).toHaveText('source-path → destination');
  });

  it('renders a menu to manage the disk', () => {
    const actionsMenu = spectator.queryAll(DeviceActionsMenuComponent);
    expect(actionsMenu).toHaveLength(1);
    expect(actionsMenu[0].device).toBe(disks[0]);
  });

  it('opens disk form when Add is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      InstanceDiskFormComponent,
      { data: { disk: undefined, instanceId: 'my-instance' } },
    );
  });

  it('opens disk for for edit when actions menu emits (edit)', () => {
    const actionsMenu = spectator.query(DeviceActionsMenuComponent)!;
    actionsMenu.edit.emit();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      InstanceDiskFormComponent,
      { data: { disk: disks[0], instanceId: 'my-instance' } },
    );
  });
});
