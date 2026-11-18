import { TnSelectOption } from '@truenas/ui-components';
import {
  optionTestIdByKebabLabel,
  optionTestIdByLabel,
  optionTestIdByValue,
} from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';

describe('tn-select option test id keys', () => {
  const nfsv3 = { label: 'NFSv3', value: 'NFSV3' } as TnSelectOption;

  it('optionTestIdByLabel returns the label as is', () => {
    expect(optionTestIdByLabel(nfsv3)).toBe('NFSv3');
  });

  it('optionTestIdByKebabLabel kebab-cases the label with lodash', () => {
    expect(optionTestIdByKebabLabel(nfsv3)).toBe('nf-sv-3');
  });

  describe('optionTestIdByValue', () => {
    it('returns a primitive value, so a mixed-case label does not split the id', () => {
      expect(optionTestIdByValue(nfsv3)).toBe('NFSV3');
      expect(optionTestIdByValue({ label: 'Two', value: 2 } as TnSelectOption)).toBe(2);
    });

    it('returns undefined for an object value', () => {
      expect(optionTestIdByValue({ label: 'Pool', value: { id: 1 } } as TnSelectOption)).toBeUndefined();
    });
  });
});
