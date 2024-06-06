import { range } from 'lodash';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';

export function makeCooling(from: number, to: number): Record<number, EnclosureElement> {
  return range(from, to + 1).reduce((acc, i) => {
    acc[i] = {
      descriptor: `FAN ENCL ${i}`,
      status: 'OK',
      value: '3420 RPM',
      value_raw: 16864930,
    };
    return acc;
  }, {} as Record<number, EnclosureElement>);
}
