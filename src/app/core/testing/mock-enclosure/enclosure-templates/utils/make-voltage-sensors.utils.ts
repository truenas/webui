import { range } from 'lodash-es';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';

export function makeVoltageSensors(from: number, to: number): Record<number, EnclosureElement> {
  return range(from, to + 1).reduce((acc, i) => {
    acc[i] = {
      descriptor: '5V Sensor',
      status: 'OK',
      value: '5.06V',
      value_raw: 16788736,
    };
    return acc;
  }, {} as Record<number, EnclosureElement>);
}
