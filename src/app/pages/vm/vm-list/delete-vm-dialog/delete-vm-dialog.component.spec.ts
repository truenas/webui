import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VmDeviceType, VmDiskMode } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';

describe('DeleteVmDialogComponent', () => {
  let spectator: Spectator<DeleteVmDialogComponent>;
  let loader: HarnessLoader;

  const mockDevices: VmDevice[] = [
    {
      id: 1,
      attributes: {
        dtype: VmDeviceType.Disk,
        path: '/dev/zvol/tank/testds/test2',
        type: VmDiskMode.Ahci,
        logical_sectorsize: 512,
        physical_sectorsize: 512,
      },
      order: 1000,
      vm: 1,
    } as VmDevice,
    {
      id: 2,
      attributes: {
        dtype: VmDeviceType.Raw,
        path: '/mnt/tank/rawfile.img',
        type: VmDiskMode.Virtio,
        size: 10,
        logical_sectorsize: null,
        physical_sectorsize: null,
        boot: false,
      },
      order: 1001,
      vm: 1,
    } as VmDevice,
    {
      id: 3,
      attributes: {
        dtype: VmDeviceType.Nic,
        type: 'E1000',
        mac: '00:a0:98:12:34:56',
        nic_attach: 'br0',
        trust_guest_rx_filters: false,
      },
      order: 1002,
      vm: 1,
    } as VmDevice,
  ];

  const createComponent = createComponentFactory({
    component: DeleteVmDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('vm.delete'),
        mockCall('vm.device.query', mockDevices),
      ]),
      mockAuth(),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 1,
          name: 'test',
        } as VirtualMachine,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes a VM when dialog is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Delete Virtual Machine Data?': true,
      'Force Delete?': true,
      'Enter test below to confirm.': 'test',
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.delete', [1, { force: true, zvols: true }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('loads devices on init', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.device.query', [[['vm', '=', 1]]]);
  });

  it('shows devices list only when "Delete Virtual Machine Data?" is checked', async () => {
    // Initially unchecked - devices section should not be visible
    expect(spectator.query('.devices-section')).not.toExist();

    // Check the checkbox
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Delete Virtual Machine Data?': true,
    });
    spectator.detectChanges();

    // Now devices section should be visible
    expect(spectator.query('.devices-section')).toExist();
    expect(spectator.query('.devices-section h3')).toHaveText('The following disks will be deleted:');
    expect(spectator.queryAll('.devices-list li')).toHaveLength(2);
  });

  it('hides devices list when "Delete Virtual Machine Data?" is unchecked', async () => {
    const form = await loader.getHarness(IxFormHarness);

    // Check then uncheck
    await form.fillForm({ 'Delete Virtual Machine Data?': true });
    spectator.detectChanges();
    expect(spectator.query('.devices-section')).toExist();

    await form.fillForm({ 'Delete Virtual Machine Data?': false });
    spectator.detectChanges();
    expect(spectator.query('.devices-section')).not.toExist();
  });

  it('displays correct device labels and filters out non-DISK/RAW devices', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'Delete Virtual Machine Data?': true });
    spectator.detectChanges();

    const deviceItems = spectator.queryAll('.devices-list li');
    // Only 2 devices should be shown (DISK and RAW), NIC should be filtered out
    expect(deviceItems).toHaveLength(2);
    expect(deviceItems[0]).toHaveText('Disk (/dev/zvol/tank/testds/test2)');
    expect(deviceItems[1]).toHaveText('Raw File (/mnt/tank/rawfile.img)');
  });

  it('does not show devices section when there are no DISK/RAW devices', async () => {
    // Simulate scenario where only non-DISK/RAW devices exist (all filtered out)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (spectator.component as any).devices.set([]);
    spectator.detectChanges();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'Delete Virtual Machine Data?': true });
    spectator.detectChanges();

    // Devices section should not be shown because there are no DISK/RAW devices
    expect(spectator.query('.devices-section')).not.toExist();
  });
});
