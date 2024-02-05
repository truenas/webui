import { FormControl } from '@angular/forms';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { MiB } from 'app/constants/bytes.constant';
import { ImageValidatorService } from 'app/modules/ix-forms/validators/image-validator/image-validator.service';

describe('ImageValidatorService', () => {
  let spectator: SpectatorService<ImageValidatorService>;
  const createService = createServiceFactory({
    service: ImageValidatorService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('doesnt show error when file size is within limit', () => {
    const fc = new FormControl();
    fc.addAsyncValidators(spectator.service.getImagesValidator(1 * MiB));
    const file = new File(['content'], 'test.png');
    Object.defineProperty(file, 'size', { value: 1000 * 1000 - 1 });
    fc.setValue([file]);
    fc.updateValueAndValidity();
    expect(fc.errors).toBeNull();
  });

  it('shows error when file size it more than limit', () => {
    const fc = new FormControl();
    fc.addAsyncValidators(spectator.service.getImagesValidator(1 * MiB));
    const file = new File(['content'], 'test.png');
    Object.defineProperty(file, 'size', { value: 1 * MiB + 1 });
    fc.setValue([file]);
    fc.updateValueAndValidity();
    expect(fc.errors).toEqual({
      ixManualValidateError: {
        message: 'test.png – File size is limited to 1 MiB.',
      },
    });
  });
});
