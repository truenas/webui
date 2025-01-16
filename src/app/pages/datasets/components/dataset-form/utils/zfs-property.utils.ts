import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export function getFieldValue<T>(property: ZfsProperty<T>, parent?: Dataset): T | typeof inherit | undefined {
  if (parent) {
    return valueOrInherit(property);
  }

  return property.value;
}

export function valueOrInherit<T>(property: ZfsProperty<T>): T | typeof inherit | undefined {
  if (!property) {
    return undefined;
  }

  if ([ZfsPropertySource.Default, ZfsPropertySource.Inherited].includes(property.source)) {
    return inherit;
  }

  return property.value;
}
