import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  VmTime, VmBootloader, VmCpuMode, VmDeviceType, VmState,
} from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmNicDevice, VmDisplayDevice, VmDiskDevice } from 'app/interfaces/vm-device.interface';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { VmService } from 'app/services/vm.service';
import { VirtualMachineDetailsRowComponent } from './vm-details-row.component';

const virtualMachine = {
  id: 2,
  name: 'test',
  description: '',
  vcpus: 2,
  memory: 4096,
  min_memory: null,
  autostart: true,
  time: VmTime.Local,
  bootloader: VmBootloader.Uefi,
  cores: 1,
  threads: 1,
  hyperv_enlightenments: false,
  shutdown_timeout: 90,
  cpu_mode: VmCpuMode.Custom,
  cpu_model: null,
  cpuset: '',
  nodeset: '',
  pin_vcpus: false,
  hide_from_msr: false,
  suspend_on_snapshot: false,
  ensure_display_device: true,
  arch_type: null,
  machine_type: null,
  uuid: '1a010e6d-c412-4e7f-a889-8a265082db83',
  command_line_args: '',
  bootloader_ovmf: 'OVMF_CODE.fd',
  trusted_platform_module: false,
  devices: [
    {
      id: 4,
      dtype: VmDeviceType.Nic,
      attributes: {
        type: 'VIRTIO',
        mac: '00:a0:98:4d:14:95',
        nic_attach: 'eno1',
        trust_guest_rx_filters: false,
      },
      order: 1002,
      vm: 2,
    } as VmNicDevice,
    {
      id: 5,
      dtype: VmDeviceType.Cdrom,
      attributes: {
        path: '/mnt/pewl/encrypted-key/TrueNAS-SCALE-24.04.0-MASTER-20240125-013910.iso',
      },
      order: 1000,
      vm: 2,
    },
    {
      id: 6,
      dtype: VmDeviceType.Display,
      attributes: {
        port: 5900,
        bind: '0.0.0.0',
        password: 'abcd1234',
        web: true,
        type: 'SPICE',
        resolution: '1024x768',
        web_port: 5901,
        wait: false,
      },
      order: 1002,
      vm: 2,
    } as VmDisplayDevice,
    {
      id: 7,
      dtype: VmDeviceType.Disk,
      attributes: {
        type: 'AHCI',
        physical_sectorsize: null,
        logical_sectorsize: null,
        iotype: 'THREADS',
        path: '/dev/zvol/pewl/new2/test-k52ib',
      },
      order: 1001,
      vm: 2,
    } as VmDiskDevice,
  ],
  display_available: true,
  status: {
    state: VmState.Running,
    pid: 12028,
    domain_state: 'RUNNING',
  },
} as VirtualMachine;

describe('VirtualMachineDetailsRowComponent', () => {
  let spectator: Spectator<VirtualMachineDetailsRowComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: VirtualMachineDetailsRowComponent,
    providers: [
      mockWebSocket([
        mockCall('vm.delete'),
      ]),
      mockProvider(VmService, {
        hasVirtualizationSupport$: of(true),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        vm: virtualMachine,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should open edit form', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: /Edit/ }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      VmEditFormComponent,
      { data: virtualMachine },
    );
  });

  it('should open delete dialog', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      DeleteVmDialogComponent,
      { data: virtualMachine },
    );
  });

  it('should redirect to devices page', async () => {
    const serialButton = await loader.getHarness(MatButtonHarness.with({ text: /Devices/ }));
    await serialButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/vm', '2', 'devices']);
  });

  it('should redirect to serial shell page', async () => {
    const serialButton = await loader.getHarness(MatButtonHarness.with({ text: /Serial Shell/ }));
    await serialButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/vm', '2', 'serial']);
  });
});
