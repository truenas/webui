import { FormControl } from '@angular/forms';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';

describe('datasetNameTooLong', () => {
  const parentPath = '/mnt/tank';
  // The longest name for which `${parentPath}/${name}` still fits within maxDatasetPath.
  const longestAllowed = maxDatasetPath - parentPath.length - 2;

  it('takes path and returns a validator that makes sure that dataset path is less than maximum', () => {
    const validator = datasetNameTooLong(parentPath);

    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('a'))).toBeNull();
    expect(validator(new FormControl('a'.repeat(longestAllowed)))).toBeNull();
    expect(validator(new FormControl('a'.repeat(longestAllowed + 1)))).toEqual({
      maxlength: {
        requiredLength: longestAllowed,
      },
    });
  });

  it('reports a length the field can actually satisfy', () => {
    const validator = datasetNameTooLong(parentPath);

    const error = validator(new FormControl('a'.repeat(maxDatasetPath)));
    const reportedLength = (error as { maxlength: { requiredLength: number } }).maxlength.requiredLength;

    expect(validator(new FormControl('a'.repeat(reportedLength)))).toBeNull();
  });

  it('blames the parent path when it leaves no room for a name at all', () => {
    const validator = datasetNameTooLong('a'.repeat(maxDatasetPath));

    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('a'))).toEqual({
      parentPathTooLong: {
        maxPathLength: maxDatasetPath,
      },
    });
  });
});
