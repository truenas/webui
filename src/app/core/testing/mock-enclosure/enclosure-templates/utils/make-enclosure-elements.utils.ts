import { range } from 'lodash-es';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';

export function makeEnclosureElements(from: number, to: number): Record<number, EnclosureElement> {
  return range(from, to + 1).reduce((acc, i) => {
    acc[i] = {
      descriptor: `EnclosureElement${i.toString().padStart(2, '0')}`,
      status: 'OK',
      value: null,
      value_raw: 16777216,
    };
    return acc;
  }, {} as Record<number, EnclosureElement>);
}
