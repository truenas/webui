import { FormBuilder, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ImageVirtualSizeValidatorService } from './image-virtual-size-validator.service';

describe('ImageVirtualSizeValidatorService', () => {
  let spectator: SpectatorService<ImageVirtualSizeValidatorService>;
  let form: FormGroup;

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
  });

  describe('validateVolsize', () => {
    describe('when import_image is false', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: false,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateVolsize(form);
        const control = new FormControl(20 * GiB);
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
      });
    });

    describe('when image_source is empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '',
        });

        const validator = spectator.service.validateVolsize(form);
        const control = new FormControl(20 * GiB);
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
      });
    });

    describe('when volsize is null or empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateVolsize(form);
        const control = new FormControl(null);
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
      });
    });

    it('validates successfully when volsize is equal to virtual size', async () => {
      const apiService = spectator.inject(ApiService);
      jest.spyOn(apiService, 'call').mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(apiService.call).toHaveBeenCalledWith('vm.device.virtual_size', [
        { path: '/mnt/pool/test.qcow2' },
      ]);
    });

    it('validates successfully when volsize is greater than virtual size', async () => {
      const apiService = spectator.inject(ApiService);
      jest.spyOn(apiService, 'call').mockReturnValue(of(10 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
    });

    it('returns error when volsize is less than virtual size', async () => {
      const apiService = spectator.inject(ApiService);
      jest.spyOn(apiService, 'call').mockReturnValue(of(30 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toEqual({
        insufficientSize: {
          message: expect.stringContaining('Disk size must be at least'),
        },
      });
    });

    it('handles API error gracefully and logs to console', async () => {
      const apiService = spectator.inject(ApiService);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(apiService, 'call').mockReturnValue(throwError(() => new Error('API error')));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateVolsize(form);
      const control = new FormControl(20 * GiB);
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get virtual size for image:',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('clears the virtual size cache', async () => {
      const apiService = spectator.inject(ApiService);
      jest.spyOn(apiService, 'call').mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      // First call should hit the API
      const validator = spectator.service.validateVolsize(form);
      const control = new FormControl(20 * GiB);
      await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(apiService.call).toHaveBeenCalledTimes(1);

      // Second call with same image should use cache (no additional API call)
      await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
      expect(apiService.call).toHaveBeenCalledTimes(1);

      // Clear the cache
      spectator.service.clearCache();

      // Third call should hit the API again after cache clear
      await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
      expect(apiService.call).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateHddPath', () => {
    describe('when import_image is false', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: false,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateHddPath(form);
        const control = new FormControl('/dev/zvol/poolio/test-zvol');
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
      });
    });

    describe('when image_source is empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '',
        });

        const validator = spectator.service.validateHddPath(form);
        const control = new FormControl('/dev/zvol/poolio/test-zvol');
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
      });
    });

    describe('when hdd_path is empty', () => {
      it('returns null without validating', async () => {
        form.patchValue({
          import_image: true,
          image_source: '/mnt/pool/test.qcow2',
        });

        const validator = spectator.service.validateHddPath(form);
        const control = new FormControl('');
        const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
        expect(result).toBeNull();
      });
    });

    it('validates successfully when zvol size is equal to virtual size', async () => {
      const apiService = spectator.inject(ApiService);
      jest.spyOn(apiService, 'call').mockImplementation((method) => {
        if (method === 'vm.device.virtual_size') {
          return of(20 * GiB);
        }
        if (method === 'pool.dataset.query') {
          return of([
            {
              type: DatasetType.Volume,
              volsize: { parsed: 20 * GiB },
            } as Dataset,
          ]);
        }
        return of(null);
      });

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(apiService.call).toHaveBeenCalledWith('vm.device.virtual_size', [
        { path: '/mnt/pool/test.qcow2' },
      ]);
      expect(apiService.call).toHaveBeenCalledWith('pool.dataset.query', [
        [['id', '=', 'poolio/test-zvol']],
      ]);
    });

    it('validates successfully when zvol size is greater than virtual size', async () => {
      const apiService = spectator.inject(ApiService);
      jest.spyOn(apiService, 'call').mockImplementation((method) => {
        if (method === 'vm.device.virtual_size') {
          return of(10 * GiB);
        }
        if (method === 'pool.dataset.query') {
          return of([
            {
              type: DatasetType.Volume,
              volsize: { parsed: 20 * GiB },
            } as Dataset,
          ]);
        }
        return of(null);
      });

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
    });

    it('returns error when zvol size is less than virtual size', async () => {
      const apiService = spectator.inject(ApiService);
      jest.spyOn(apiService, 'call').mockImplementation((method) => {
        if (method === 'vm.device.virtual_size') {
          return of(30 * GiB);
        }
        if (method === 'pool.dataset.query') {
          return of([
            {
              type: DatasetType.Volume,
              volsize: { parsed: 20 * GiB },
            } as Dataset,
          ]);
        }
        return of(null);
      });

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toEqual({
        insufficientZvolSize: {
          message: expect.stringContaining('Selected zvol'),
        },
      });
    });

    it('handles dataset not found gracefully', async () => {
      const apiService = spectator.inject(ApiService);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(apiService, 'call').mockImplementation((method) => {
        if (method === 'vm.device.virtual_size') {
          return of(20 * GiB);
        }
        if (method === 'pool.dataset.query') {
          return of([]);
        }
        return of(null);
      });

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
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
      const apiService = spectator.inject(ApiService);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(apiService, 'call').mockImplementation((method) => {
        if (method === 'vm.device.virtual_size') {
          return of(20 * GiB);
        }
        if (method === 'pool.dataset.query') {
          return throwError(() => new Error('Dataset query failed'));
        }
        return of(null);
      });

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to query dataset for zvol:',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles virtual size API error gracefully', async () => {
      const apiService = spectator.inject(ApiService);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(apiService, 'call').mockReturnValue(throwError(() => new Error('API error')));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
      const control = new FormControl('/dev/zvol/poolio/test-zvol');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get virtual size for image:',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles invalid zvol path format gracefully', async () => {
      const apiService = spectator.inject(ApiService);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(apiService, 'call').mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
      const control = new FormControl('/invalid/path/format');
      const result = await firstValueFrom(validator(control) as Observable<ValidationErrors | null>);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid zvol path format, expected path to start with /dev/zvol/:',
        '/invalid/path/format',
      );
      expect(apiService.call).toHaveBeenCalledWith('vm.device.virtual_size', [
        { path: '/mnt/pool/test.qcow2' },
      ]);
      // Should not call pool.dataset.query for invalid paths
      expect(apiService.call).not.toHaveBeenCalledWith('pool.dataset.query', expect.anything());
      consoleErrorSpy.mockRestore();
    });

    it('handles empty dataset path after prefix removal', async () => {
      const apiService = spectator.inject(ApiService);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(apiService, 'call').mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
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
      const apiService = spectator.inject(ApiService);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(apiService, 'call').mockReturnValue(of(20 * GiB));

      form.patchValue({
        import_image: true,
        image_source: '/mnt/pool/test.qcow2',
      });

      const validator = spectator.service.validateHddPath(form);
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
