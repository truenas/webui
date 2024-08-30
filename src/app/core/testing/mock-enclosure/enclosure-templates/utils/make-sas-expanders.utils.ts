import { range } from 'lodash-es';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';

export function makeSasExpanders(from: number, to: number): Record<number, EnclosureElement> {
  return range(from, to + 1).reduce((acc, i) => {
    acc[i] = {
      descriptor: 'SAS3 Expander',
      status: 'OK',
      value: null,
      value_raw: 16777216,
    };
    return acc;
  }, {} as Record<number, EnclosureElement>);
}
