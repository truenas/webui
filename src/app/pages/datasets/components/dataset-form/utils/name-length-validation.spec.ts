import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';

describe('datasetNameTooLong', () => {
  const translate = { instant: (key: string) => key } as TranslateService;
  const parentPath = '/mnt/tank';
  // The parent path and the '/' are spent already, and the whole path stays under the max.
  const longestAllowedName = maxDatasetPath - parentPath.length - 2;

  it('allows a name that keeps the whole path within the maximum', () => {
    const validator = datasetNameTooLong(parentPath, translate);

    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('a'))).toBeNull();
    expect(validator(new FormControl('a'.repeat(longestAllowedName)))).toBeNull();
  });

  it('rejects a name that pushes the path over the maximum', () => {
    const validator = datasetNameTooLong(parentPath, translate);

    expect(validator(new FormControl('a'.repeat(longestAllowedName + 1)))).toEqual({
      maxlength: {
        requiredLength: longestAllowedName,
      },
    });
  });

  it('reports the length it actually enforces, so a name of that length passes', () => {
    // A parent path long enough that the name gets a single character.
    const nearlyFullPath = 'a'.repeat(maxDatasetPath - 3);
    const validator = datasetNameTooLong(nearlyFullPath, translate);

    expect(validator(new FormControl('d'))).toBeNull();
    expect(validator(new FormControl('dd'))).toEqual({
      maxlength: {
        requiredLength: 1,
      },
    });
  });

  it('says the parent path has no room left, rather than "no more than 0"', () => {
    const validator = datasetNameTooLong('a'.repeat(maxDatasetPath - 2), translate);

    expect(validator(new FormControl('d'))).toEqual({
      maxlength: {
        requiredLength: 0,
        message: 'The parent path is already at the maximum length, so no name will fit.',
      },
    });
  });

  it('ignores an empty name or a missing parent path', () => {
    expect(datasetNameTooLong(parentPath, translate)(new FormControl(''))).toBeNull();
    expect(datasetNameTooLong('', translate)(new FormControl('name'))).toBeNull();
  });
});
