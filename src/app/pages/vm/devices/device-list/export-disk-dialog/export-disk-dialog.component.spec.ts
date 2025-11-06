import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { VmDeviceType, VmDiskMode } from 'app/enums/vm.enum';
import { VmDiskDevice } from 'app/interfaces/vm-device.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { FilesystemService } from 'app/services/filesystem.service';
import {
  ExportDiskDialogComponent,
  ExportDiskDialogData,
} from './export-disk-dialog.component';

describe('ExportDiskDialogComponent', () => {
  let spectator: Spectator<ExportDiskDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const mockDevice: VmDiskDevice = {
    id: 1,
    dtype: VmDeviceType.Disk,
    vm: 1,
    order: 1,
    attributes: {
      dtype: VmDeviceType.Disk,
      path: '/dev/zvol/tank/vm-disk',
      logical_sectorsize: 512,
      physical_sectorsize: 4096,
      type: VmDiskMode.Ahci,
    },
  } as VmDiskDevice;

  const mockDialogData: ExportDiskDialogData = {
    device: mockDevice,
    vmName: 'test-vm',
  };

  const createComponent = createComponentFactory({
    component: ExportDiskDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxExplorerComponent,
      IxInputComponent,
      IxSelectComponent,
      TranslateModule.forRoot(),
    ],
    providers: [
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => jest.fn()),
      }),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: mockDialogData,
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows the source disk path', () => {
    const sourceInfo = spectator.query('.source-info strong');
    expect(sourceInfo).toHaveText('/dev/zvol/tank/vm-disk');
  });

  it('initializes form with default values', async () => {
    const values = await form.getValues();
    expect(values['Destination Directory']).toBe('');
    expect(values['Image Name']).toContain('test-vm_disk_');
    expect(values['Image Format']).toBe('QCOW2 - QEMU Copy On Write');
  });

  it('closes dialog with export data when form is submitted', async () => {
    await form.fillForm({
      'Destination Directory': '/mnt/tank/exports',
      'Image Name': 'my-vm-disk',
      'Image Format': 'VMDK - VMware Virtual Machine Disk',
    });

    spectator.click(spectator.query('button[ixTest="export"]'));

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      request: {
        source: '/dev/zvol/tank/vm-disk',
        destination: '/mnt/tank/exports/my-vm-disk.vmdk',
      },
      destinationPath: '/mnt/tank/exports/my-vm-disk.vmdk',
    });
  });

  it('disables submit button when form is invalid', () => {
    // Clear required fields to make the form invalid
    spectator.component.form.patchValue({ destinationDir: '', imageName: '' });
    spectator.detectChanges();

    const submitButton = spectator.query('button[ixTest="export"]');
    expect(submitButton).toBeDisabled();
  });

  it('provides format options for image export', () => {
    const formatOptions = spectator.component.imageFormats;
    expect(formatOptions).toHaveLength(6);
    expect(formatOptions.map((format) => format.value)).toEqual([
      'qcow2', 'qed', 'raw', 'vdi', 'vhdx', 'vmdk',
    ]);
  });

  describe('pool root validation', () => {
    it('rejects pool root paths like /mnt/poolname', () => {
      spectator.component.form.patchValue({ destinationDir: '/mnt/tank' });
      spectator.detectChanges();

      expect(spectator.component.form.controls.destinationDir.errors).toEqual({
        poolRoot: {
          message: 'Cannot export to pool root. Please select a dataset under the pool (e.g., /mnt/pool/dataset).',
        },
      });
      expect(spectator.component.form.valid).toBe(false);
    });

    it('rejects pool root paths with trailing slash', () => {
      spectator.component.form.patchValue({ destinationDir: '/mnt/tank/' });
      spectator.detectChanges();

      expect(spectator.component.form.controls.destinationDir.errors).toEqual({
        poolRoot: {
          message: 'Cannot export to pool root. Please select a dataset under the pool (e.g., /mnt/pool/dataset).',
        },
      });
    });

    it('accepts dataset paths like /mnt/poolname/dataset', () => {
      spectator.component.form.patchValue({
        destinationDir: '/mnt/tank/exports',
        imageName: 'test-disk',
        format: 'raw',
      });
      spectator.detectChanges();

      expect(spectator.component.form.controls.destinationDir.errors).toBeNull();
      expect(spectator.component.form.valid).toBe(true);
    });

    it('accepts nested dataset paths', () => {
      spectator.component.form.patchValue({
        destinationDir: '/mnt/tank/exports/vm-backups',
        imageName: 'test-disk',
        format: 'raw',
      });
      spectator.detectChanges();

      expect(spectator.component.form.controls.destinationDir.errors).toBeNull();
      expect(spectator.component.form.valid).toBe(true);
    });
  });
});
