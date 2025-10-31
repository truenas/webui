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
import { ImageVirtualSizeValidatorService } from 'app/pages/vm/utils/image-virtual-size-validator.service';
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
      mockProvider(ImageVirtualSizeValidatorService),
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
          message: expect.stringContaining('.qcow2'),
        },
      });
      expect(spectator.component.form.controls.image_source.errors.invalidImageFormat.message)
        .toContain('.vmdk');

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

  describe('async validator attachment and removal', () => {
    let imageVirtualSizeValidator: ImageVirtualSizeValidatorService;

    beforeEach(() => {
      imageVirtualSizeValidator = spectator.inject(ImageVirtualSizeValidatorService);
    });

    it('attaches volsize async validator when creating new disk and importing image', async () => {
      const validateVolsizeSpy = jest.spyOn(imageVirtualSizeValidator, 'validateVolsize');

      const importCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Import Image' }));
      await importCheckbox.setValue(true);

      expect(validateVolsizeSpy).toHaveBeenCalledWith(spectator.component.form);
    });

    it('attaches hdd_path async validator when using existing disk and importing image', async () => {
      const validateHddPathSpy = jest.spyOn(imageVirtualSizeValidator, 'validateHddPath');

      const modeRadio = await loader.getHarness(IxRadioGroupHarness);
      await modeRadio.setValue('Use existing disk image');

      const importCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Import Image' }));
      await importCheckbox.setValue(true);

      expect(validateHddPathSpy).toHaveBeenCalledWith(spectator.component.form);
    });

    it('does not call validator methods when import image is unchecked', () => {
      const validateVolsizeSpy = jest.spyOn(imageVirtualSizeValidator, 'validateVolsize');
      const validateHddPathSpy = jest.spyOn(imageVirtualSizeValidator, 'validateHddPath');

      // Import image is false by default, so validators should not be called
      spectator.component.form.controls.volsize.setValue(20 * GiB);
      spectator.component.form.controls.hdd_path.setValue('/dev/zvol/poolio/test');

      expect(validateVolsizeSpy).not.toHaveBeenCalled();
      expect(validateHddPathSpy).not.toHaveBeenCalled();
    });

    it('switches validators when changing between new and existing disk modes', async () => {
      const validateVolsizeSpy = jest.spyOn(imageVirtualSizeValidator, 'validateVolsize');
      const validateHddPathSpy = jest.spyOn(imageVirtualSizeValidator, 'validateHddPath');

      const importCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Import Image' }));
      await importCheckbox.setValue(true);

      // Initially in "new disk" mode - validateVolsize should be called
      expect(validateVolsizeSpy).toHaveBeenCalledTimes(1);
      expect(validateHddPathSpy).not.toHaveBeenCalled();

      validateVolsizeSpy.mockClear();
      validateHddPathSpy.mockClear();

      // Switch to "existing disk" mode
      const modeRadio = await loader.getHarness(IxRadioGroupHarness);
      await modeRadio.setValue('Use existing disk image');

      // Now validateHddPath should be called
      expect(validateHddPathSpy).toHaveBeenCalledTimes(1);
      expect(validateVolsizeSpy).not.toHaveBeenCalled();

      validateVolsizeSpy.mockClear();
      validateHddPathSpy.mockClear();

      // Switch back to "new disk" mode
      await modeRadio.setValue('Create new disk image');

      // validateVolsize should be called again
      expect(validateVolsizeSpy).toHaveBeenCalledTimes(1);
      expect(validateHddPathSpy).not.toHaveBeenCalled();
    });

    it('does not trigger validation on image source change if import is disabled', async () => {
      const importCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Import Image' }));
      await importCheckbox.setValue(true);

      // Spy on updateValueAndValidity
      const volsizeUpdateSpy = jest.spyOn(spectator.component.form.controls.volsize, 'updateValueAndValidity');
      const hddPathUpdateSpy = jest.spyOn(spectator.component.form.controls.hdd_path, 'updateValueAndValidity');

      // Disable import - this will trigger updateValueAndValidity via setConditionalValidators
      await importCheckbox.setValue(false);

      // Clear spy call history after setup
      volsizeUpdateSpy.mockClear();
      hddPathUpdateSpy.mockClear();

      // Change image source
      spectator.component.form.controls.image_source.setValue('/mnt/pool/test.qcow2');

      // Wait for debounce
      await new Promise((resolve) => {
        setTimeout(resolve, 350);
      });

      // Validation should not be triggered because import is disabled
      expect(volsizeUpdateSpy).not.toHaveBeenCalled();
      expect(hddPathUpdateSpy).not.toHaveBeenCalled();
    });

    it('clears the validator cache on component destroy', () => {
      const clearCacheSpy = jest.spyOn(imageVirtualSizeValidator, 'clearCache');

      spectator.component.ngOnDestroy();

      expect(clearCacheSpy).toHaveBeenCalled();
    });
  });
});
