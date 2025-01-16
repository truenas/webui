import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { getFieldValue, valueOrInherit } from 'app/pages/datasets/components/dataset-form/utils/zfs-property.utils';

describe('getFieldValue', () => {
  it('returns the value of the property if there is no parent', () => {
    const property = {
      value: 'value',
    } as ZfsProperty<string>;
    expect(getFieldValue(property)).toBe('value');
  });
});

describe('valueOrInherit', () => {
  it('returns inherit if property source is Default or Inherited', () => {
    expect(valueOrInherit({
      source: ZfsPropertySource.Default,
    } as ZfsProperty<string>)).toBe(inherit);

    expect(valueOrInherit({
      source: ZfsPropertySource.Inherited,
    } as ZfsProperty<string>)).toBe(inherit);
  });

  it('returns property value when property source is not Default or Inherited', () => {
    expect(valueOrInherit({
      value: 'value',
      source: ZfsPropertySource.Local,
    } as ZfsProperty<string>)).toBe('value');
  });
});
