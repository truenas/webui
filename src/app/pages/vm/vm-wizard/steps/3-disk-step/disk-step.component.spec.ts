import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VmDiskMode } from 'app/enums/vm.enum';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { FreeSpaceValidatorService } from 'app/pages/vm/utils/free-space-validator.service';
import { DiskStepComponent, NewOrExistingDisk } from 'app/pages/vm/vm-wizard/steps/3-disk-step/disk-step.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('DiskStepComponent', () => {
  let spectator: Spectator<DiskStepComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: DiskStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('pool.filesystem_choices', [
          'poolio',
          'poolio/files',
        ]),
        mockCall('vm.device.disk_choices', {
          '/dev/zvol/poolio/test-327brn': 'poolio/test-327brn',
        }),
      ]),
      mockProvider(FreeSpaceValidatorService, {
        validate: () => of(null),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => jest.fn()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('create new disk image', () => {
    beforeEach(async () => {
      await form.fillForm({
        'Select Disk Type': 'AHCI',
        'Zvol Location': 'poolio',
        Size: '20 GiB',
      });
    });

    it('shows form fields', () => {
      expect(spectator.component.form.value).toEqual({
        newOrExisting: NewOrExistingDisk.New,
        hdd_type: VmDiskMode.Ahci,
        datastore: 'poolio',
        hdd_path: '',
        volsize: 20 * GiB,
        import_image: false,
        image_source: '',
      });
    });

    it('returns summary when getSummary is used', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Disk',
          value: 'Create new disk image',
        },
        {
          label: 'Disk Description',
          value: '20 GiB AHCI at poolio',
        },
      ]);
    });
  });

  describe('use existing disk image', () => {
    beforeEach(async () => {
      const modeRadio = await loader.getHarness(IxRadioGroupHarness);
      await modeRadio.setValue('Use existing disk image');

      await form.fillForm({
        'Select Disk Type': 'VirtIO',
        'Select Existing Zvol': 'poolio/test-327brn',
      });
    });

    it('shows form fields', () => {
      expect(spectator.component.form.value).toEqual({
        newOrExisting: NewOrExistingDisk.Existing,
        hdd_path: '/dev/zvol/poolio/test-327brn',
        hdd_type: VmDiskMode.Virtio,
        datastore: '',
        volsize: null,
        import_image: false,
        image_source: '',
      });
    });

    it('returns summary when getSummary is used', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Disk',
          value: 'Use existing disk image',
        },
        {
          label: 'Disk Description',
          value: 'VIRTIO at /dev/zvol/poolio/test-327brn',
        },
      ]);
    });
  });

  describe('import disk image', () => {
    beforeEach(async () => {
      const importCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Import Image' }));
      await importCheckbox.setValue(true);
    });

    it('shows image source field when import checkbox is checked', async () => {
      const formValues = await form.getValues();
      expect(formValues).toMatchObject({
        'Import Image': true,
      });

      const labels = await form.getLabels();
      expect(labels).toContain('Image Source');
    });

    it('validates image file extensions', () => {
      // Set an invalid file extension
      spectator.component.form.controls.image_source.setValue('/mnt/pool/invalid.txt');
      spectator.component.form.controls.image_source.updateValueAndValidity();

      expect(spectator.component.form.controls.image_source.errors).toEqual({
        invalidImageFormat: {
          message: 'File must be one of the following formats: .qcow2, .qed, .raw, .vdi, .vhdx, .vmdk',
        },
      });

      // Set a valid file extension
      spectator.component.form.controls.image_source.setValue('/mnt/pool/valid.qcow2');
      spectator.component.form.controls.image_source.updateValueAndValidity();

      expect(spectator.component.form.controls.image_source.errors).toBeNull();
    });

    it('includes import information in summary when image is selected', async () => {
      await form.fillForm({
        'Select Disk Type': 'AHCI',
        'Zvol Location': 'poolio',
        Size: '20 GiB',
      });

      spectator.component.form.controls.image_source.setValue('/mnt/pool/ubuntu.qcow2');

      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Disk',
          value: 'Create new disk image',
        },
        {
          label: 'Disk Description',
          value: '20 GiB AHCI at poolio',
        },
        {
          label: 'Import Image',
          value: 'Yes, from /mnt/pool/ubuntu.qcow2',
        },
      ]);
    });

    it('accepts all supported image formats', () => {
      const validFormats = ['.qcow2', '.qed', '.raw', '.vdi', '.vhdx', '.vmdk'];

      validFormats.forEach((format) => {
        const testPath = `/mnt/pool/image${format}`;
        spectator.component.form.controls.image_source.setValue(testPath);
        spectator.component.form.controls.image_source.updateValueAndValidity();

        expect(spectator.component.form.controls.image_source.errors).toBeNull();
      });
    });

    it('requires image source when import is checked', () => {
      spectator.component.form.controls.image_source.setValue('');
      spectator.component.form.controls.image_source.updateValueAndValidity();

      expect(spectator.component.form.controls.image_source.hasError('required')).toBe(true);
    });
  });
});
