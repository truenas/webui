import { TranslateService } from '@ngx-translate/core';
import { generateOptionsRange, mapToOptions } from 'app/helpers/options.helper';

describe('generateOptionsRange', () => {
  it('generates a range of options based on range of numbers', () => {
    expect(generateOptionsRange(1, 3)).toStrictEqual([
      { label: '1', value: 1 },
      { label: '2', value: 2 },
      { label: '3', value: 3 },
    ]);
  });
});

describe('mapToOptions', () => {
  it('converts JS Map to an array of options while invoking translation on labels', () => {
    const translate = {
      instant: jest.fn((label) => label) as TranslateService['instant'],
    } as TranslateService;

    const map = new Map([
      ['key1', 'label1'],
      ['key2', 'label2'],
    ]);

    const options = mapToOptions(map, translate);

    expect(options).toEqual([
      { label: 'label1', value: 'key1' },
      { label: 'label2', value: 'key2' },
    ]);
    expect(translate.instant).toHaveBeenCalledTimes(2);
  });
});
