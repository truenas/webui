import { SimpleChange } from '@angular/core';
import { Overwrite } from 'utility-types';

export type IxSimpleChange<T> = Overwrite<SimpleChange, {
  previousValue: T;
  currentValue: T;
}>;

export type IxSimpleChanges<T> = {
  [K in keyof T]: IxSimpleChange<T[K]>;
};
