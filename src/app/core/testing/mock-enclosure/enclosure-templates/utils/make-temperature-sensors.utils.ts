import { range } from 'lodash-es';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';

export function makeTemperatureSensors(from: number, to: number): Record<number, EnclosureElement> {
  return range(from, to + 1).reduce((acc, i) => {
    acc[i] = {
      descriptor: `Sense BP${i}`,
      status: 'OK',
      value: '25C',
      value_raw: 16788736,
    };
    return acc;
  }, {} as Record<number, EnclosureElement>);
}
