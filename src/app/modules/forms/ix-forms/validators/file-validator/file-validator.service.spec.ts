import { FormControl, ValidatorFn } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MiB } from 'app/constants/bytes.constant';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { FileValidatorService } from 'app/modules/forms/ix-forms/validators/file-validator/file-validator.service';

describe('FileValidatorService', () => {
  let spectator: SpectatorService<FileValidatorService>;
  const maxSizeInBytes = 10 * MiB;
  let validatorFn: ValidatorFn;

  const createService = createServiceFactory({
    service: FileValidatorService,
  });
  beforeEach(() => {
    spectator = createService();

    validatorFn = spectator.service.maxSize(maxSizeInBytes);
  });

  it('should return null if value is null', () => {
    const control = new FormControl(null as File[] | null);
    expect(validatorFn(control)).toBeNull();
  });

  it('should return null if there are no files in the array', () => {
    const control = new FormControl([] as File[]);
    expect(validatorFn(control)).toBeNull();
  });

  it('should return null if all files are within size limit', () => {
    const file1 = fakeFile('file1.txt', 2 * MiB);

    const control = new FormControl([file1]);
    expect(validatorFn(control)).toBeNull();
  });

  it('should return an error object if any file exceeds the size limit', () => {
    const file1 = fakeFile('file1.txt', 11 * MiB);

    const control = new FormControl([file1]);
    expect(validatorFn(control)).toEqual({
      [ixManualValidateError]: {
        message: 'Maximum file size is limited to 10 MiB.',
      },
    });
  });
});
