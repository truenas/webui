import { FormControl } from '@angular/forms';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';

describe('datasetNameTooLong', () => {
  const parentPath = '/mnt/tank';
  // The parent path and the '/' are spent already, and the whole path stays under the max.
  const longestAllowedName = maxDatasetPath - parentPath.length - 2;

  it('allows a name that keeps the whole path within the maximum', () => {
    const validator = datasetNameTooLong(parentPath);

    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('a'))).toBeNull();
    expect(validator(new FormControl('a'.repeat(longestAllowedName)))).toBeNull();
  });

  it('rejects a name that pushes the path over the maximum', () => {
    const validator = datasetNameTooLong(parentPath);

    expect(validator(new FormControl('a'.repeat(longestAllowedName + 1)))).toEqual({
      maxlength: {
        requiredLength: longestAllowedName,
      },
    });
  });

  it('reports the length it actually enforces, so a name of that length passes', () => {
    // A parent path long enough that the name gets a single character.
    const nearlyFullPath = 'a'.repeat(maxDatasetPath - 3);
    const validator = datasetNameTooLong(nearlyFullPath);

    expect(validator(new FormControl('d'))).toBeNull();
    expect(validator(new FormControl('dd'))).toEqual({
      maxlength: {
        requiredLength: 1,
      },
    });
  });

  it('reports no room at all when the parent path leaves none', () => {
    const validator = datasetNameTooLong('a'.repeat(maxDatasetPath - 2));

    expect(validator(new FormControl('d'))).toEqual({
      maxlength: {
        requiredLength: 0,
      },
    });
  });

  it('ignores an empty name or a missing parent path', () => {
    expect(datasetNameTooLong(parentPath)(new FormControl(''))).toBeNull();
    expect(datasetNameTooLong('')(new FormControl('name'))).toBeNull();
  });
});
