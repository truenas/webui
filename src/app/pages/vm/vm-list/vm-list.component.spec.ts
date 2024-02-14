import { LayoutModule } from '@angular/cdk/layout';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmState, VmTime,
} from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDiskDevice, VmDisplayDevice, VmNicDevice } from 'app/interfaces/vm-device.interface';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { VmService } from 'app/services/vm.service';
import { VmListComponent } from './vm-list.component';

const virtualMachines: VirtualMachine[] = [
  {
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
  },
  {
    id: 3,
    name: 'test_refactoring',
    description: 'test_refactoring',
    vcpus: 1,
    memory: 512,
    min_memory: null,
    autostart: true,
    time: VmTime.Utc,
    bootloader: VmBootloader.Uefi,
    cores: 1,
    threads: 1,
    hyperv_enlightenments: false,
    shutdown_timeout: 90,
    cpu_mode: VmCpuMode.Custom,
    cpu_model: 'pentium',
    cpuset: '',
    nodeset: '',
    pin_vcpus: false,
    hide_from_msr: false,
    suspend_on_snapshot: false,
    ensure_display_device: true,
    arch_type: null,
    machine_type: null,
    uuid: '1d7d6239-0911-4245-a0a9-2444b95d60b5',
    command_line_args: '',
    bootloader_ovmf: 'OVMF_CODE.fd',
    trusted_platform_module: false,
    devices: [
      {
        id: 8,
        dtype: VmDeviceType.Nic,
        attributes: {
          type: 'VIRTIO',
          mac: '00:a0:98:41:9c:95',
          nic_attach: 'eno1',
          trust_guest_rx_filters: false,
        },
        order: 1002,
        vm: 3,
      } as VmNicDevice,
      {
        id: 9,
        dtype: VmDeviceType.Cdrom,
        attributes: {
          path: '/mnt/pewl/denys',
        },
        order: 1000,
        vm: 3,
      },
      {
        id: 10,
        dtype: VmDeviceType.Disk,
        attributes: {
          type: 'AHCI',
          physical_sectorsize: null,
          logical_sectorsize: null,
          iotype: 'THREADS',
          path: '/dev/zvol/pewl/not-encrypted/not-encrypted-not-inherited/test_refactoring-g2r2vq',
        },
        order: 1001,
        vm: 3,
      } as VmDiskDevice,
      {
        id: 11,
        dtype: VmDeviceType.Display,
        attributes: {
          port: 5902,
          bind: '0.0.0.0',
          password: 'abcd1234',
          web: true,
          type: 'SPICE',
          resolution: '1024x768',
          web_port: 5903,
          wait: false,
        },
        order: 1002,
        vm: 3,
      } as VmDisplayDevice,
    ],
    display_available: true,
    status: {
      state: VmState.Stopped,
      pid: null,
      domain_state: 'SHUTOFF',
    },
  },
];

describe('VmListComponent', () => {
  let spectator: Spectator<VmListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: VmListComponent,
    imports: [
      AppLoaderModule,
      IxTable2Module,
      LayoutModule,
    ],
    declarations: [],
    providers: [
      mockWebSocket([
        mockCall('vm.query', virtualMachines),
      ]),
      mockProvider(SystemGeneralService, {
        isEnterprise: () => false,
      }),
      mockProvider(VmService, {
        getAvailableMemory: () => of(4096),
        hasVirtualizationSupport$: () => of(true),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'State', 'Start on Boot'],
      ['test', '', ''],
      ['test_refactoring', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  // The button inside <ng-template ixPageHeader> is not being found
  // TODO: Find a way to mock PageHeaderDirective
  it.skip('opens vm wizard when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(VmWizardComponent);
  });
});
