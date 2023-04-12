import { FormControl } from '@angular/forms';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';

describe('datasetNameTooLong', () => {
  it('takes path and returns a validator that makes sure that dataset path is less than maximum', () => {
    const parentPath = '/mnt/tank';
    const validator = datasetNameTooLong(parentPath);

    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('a'))).toBeNull();
    expect(validator(new FormControl('a'.repeat(maxDatasetPath - parentPath.length - 1)))).toEqual({
      maxlength: {
        requiredLength: 191,
      },
    });
  });
});
