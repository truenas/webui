import { Signal, SimpleChange } from '@angular/core';

type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;

export type IxSimpleChange<T> = Omit<SimpleChange, 'previousValue' | 'currentValue'> & {
  previousValue: UnwrapSignal<T>;
  currentValue: UnwrapSignal<T>;
};

export type IxSimpleChanges<T> = {
  [K in keyof T]: IxSimpleChange<T[K]>;
};
