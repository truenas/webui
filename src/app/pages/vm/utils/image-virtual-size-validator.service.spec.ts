import { FormBuilder, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, Observable, of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ImageVirtualSizeValidatorService } from './image-virtual-size-validator.service';

describe('ImageVirtualSizeValidatorService', () => {
  let spectator: SpectatorService<ImageVirtualSizeValidatorService>;
  let form: FormGroup;
  let mockGetVirtualSize: jest.Mock<Observable<number | null>, [string]>;
  let mockQueryDataset: jest.Mock<Observable<Dataset[]>, [string]>;

  const createService = createServiceFactory({
    service: ImageVirtualSizeValidatorService,
    providers: [
      FormBuilder,
      mockProvider(IxValidatorsService, {
        makeErrorMessage: jest.fn((errorKey: string, message: string) => ({
          [errorKey]: { message },
        })),
      }),
      mockApi(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    const fb = spectator.inject(FormBuilder);
    form = fb.group({
      import_image: [false],
      image_source: [''],
      newOrExisting: ['new'],
      volsize: [null],
      hdd_path: [''],
    });

    // Mock functions that would be provided by the component
    mockGetVirtualSize = jest.fn();
    mockQueryDataset = jest.fn();
  });

  describe('validateVolsize', () => {
    describe('when import_image is false', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: false,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateVolsize(form, mockGetVirtualSize);
        const control = new FormControl(20 * GiB);
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
        expect(mockGetVirtualSize).not.toHaveBeenCalled();
      });
    });

    describe('when image_source is empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '',
        });

        const validator = spectator.service.validateVolsize(form, mockGetVirtualSize);
        const control = new FormControl(20 * GiB);
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
        expect(mockGetVirtualSize).not.toHaveBeenCalled();
      });
    });

    describe('when volsize is null or empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateVolsize(form, mockGetVirtualSize);
        const control = new FormControl(null);
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
        expect(mockGetVirtualSize).not.toHaveBeenCalled();
      });
    });

    it('validates successfully when volsize is equal to virtual size', async () => {
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form, mockGetVirtualSize);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(mockGetVirtualSize).toHaveBeenCalledWith('/mnt/pool/test.qcow2');
    });

    it('validates successfully when volsize is greater than virtual size', async () => {
      mockGetVirtualSize.mockReturnValue(of(10 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form, mockGetVirtualSize);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
    });

    it('returns error when volsize is less than virtual size', async () => {
      mockGetVirtualSize.mockReturnValue(of(30 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form, mockGetVirtualSize);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toEqual({
        insufficientSize: {
          message: expect.stringContaining('Disk size must be at least'),
        },
      });
    });

    it('handles API error gracefully when getVirtualSize returns null', async () => {
      mockGetVirtualSize.mockReturnValue(of(null));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form, mockGetVirtualSize);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
    });
  });

  describe('validateHddPath', () => {
    describe('when import_image is false', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: false,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
        const control = new FormControl('/dev/zvol/poolio/test-zvol');
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
        expect(mockGetVirtualSize).not.toHaveBeenCalled();
        expect(mockQueryDataset).not.toHaveBeenCalled();
      });
    });

    describe('when image_source is empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '',
        });

        const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
        const control = new FormControl('/dev/zvol/poolio/test-zvol');
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
        expect(mockGetVirtualSize).not.toHaveBeenCalled();
        expect(mockQueryDataset).not.toHaveBeenCalled();
      });
    });

    describe('when hdd_path is empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
        const control = new FormControl('');
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
        expect(mockGetVirtualSize).not.toHaveBeenCalled();
        expect(mockQueryDataset).not.toHaveBeenCalled();
      });
    });

    it('validates successfully when zvol size is equal to virtual size', async () => {
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));
      mockQueryDataset.mockReturnValue(of([
        {
          type: DatasetType.Volume,
          volsize: { parsed: 20 * GiB },
        } as Dataset,
      ]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(mockGetVirtualSize).toHaveBeenCalledWith('/mnt/pool/test.qcow2');
      expect(mockQueryDataset).toHaveBeenCalledWith('poolio/test-zvol');
    });

    it('validates successfully when zvol size is greater than virtual size', async () => {
      mockGetVirtualSize.mockReturnValue(of(10 * GiB));
      mockQueryDataset.mockReturnValue(of([
        {
          type: DatasetType.Volume,
          volsize: { parsed: 20 * GiB },
        } as Dataset,
      ]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
    });

    it('returns error when zvol size is less than virtual size', async () => {
      mockGetVirtualSize.mockReturnValue(of(30 * GiB));
      mockQueryDataset.mockReturnValue(of([
        {
          type: DatasetType.Volume,
          volsize: { parsed: 20 * GiB },
        } as Dataset,
      ]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toEqual({
        insufficientZvolSize: {
          message: expect.stringContaining('Selected zvol'),
        },
      });
    });

    it('handles dataset not found gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));
      mockQueryDataset.mockReturnValue(of([] as Dataset[]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Dataset not found for path:',
        'poolio/test-zvol',
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles dataset query error gracefully', async () => {
      // The component's queryDataset method handles errors and returns empty array
      // This test verifies that an empty dataset array is handled gracefully
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));
      mockQueryDataset.mockReturnValue(of([] as Dataset[]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Dataset not found for path:',
        'poolio/test-zvol',
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles non-zvol dataset type (filesystem) gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));
      mockQueryDataset.mockReturnValue(of([
        {
          type: DatasetType.Filesystem,
          volsize: { parsed: 20 * GiB },
        } as Dataset,
      ]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-dataset');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Selected dataset is not a zvol or has no volsize:',
        expect.objectContaining({ type: DatasetType.Filesystem }),
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles missing volsize property gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));
      mockQueryDataset.mockReturnValue(of([
        {
          type: DatasetType.Volume,
          volsize: undefined,
        } as Dataset,
      ]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Selected dataset is not a zvol or has no volsize:',
        expect.objectContaining({ type: DatasetType.Volume, volsize: undefined }),
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles missing volsize.parsed property gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));
      mockQueryDataset.mockReturnValue(of([
        {
          type: DatasetType.Volume,
          volsize: { parsed: undefined },
        } as Dataset,
      ]));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Selected dataset is not a zvol or has no volsize:',
        expect.objectContaining({ type: DatasetType.Volume }),
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles virtual size API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(null));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(mockQueryDataset).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('handles invalid zvol path format gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/invalid/path/format');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid zvol path format, expected path to start with /dev/zvol/:',
        '/invalid/path/format',
      );
      expect(mockGetVirtualSize).toHaveBeenCalledWith('/mnt/pool/test.qcow2');
      // Should not call queryDataset for invalid paths
      expect(mockQueryDataset).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('handles empty dataset path after prefix removal', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid zvol path format, dataset path is empty or contains double slashes:',
        '/dev/zvol/',
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles dataset path with double slashes', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetVirtualSize.mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form, mockGetVirtualSize, mockQueryDataset);
      const control = new FormControl('/dev/zvol/pool//test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid zvol path format, dataset path is empty or contains double slashes:',
        '/dev/zvol/pool//test-zvol',
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
