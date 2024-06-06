import { range } from 'lodash';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';

export function makePowerSupply(from: number, to: number): Record<number, EnclosureElement> {
  return range(from, to + 1).reduce((acc, i) => {
    acc[i] = {
      descriptor: 'Power Supply',
      status: 'OK',
      value: null,
      value_raw: '0x10000a0',
    };
    return acc;
  }, {} as Record<number, EnclosureElement>);
}
