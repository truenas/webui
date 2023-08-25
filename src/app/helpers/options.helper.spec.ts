import { generateOptionsRange } from 'app/helpers/options.helper';

describe('generateOptionsRange', () => {
  it('generates a range of options based on range of numbers', () => {
    expect(generateOptionsRange(1, 3)).toStrictEqual([
      { label: '1', value: 1 },
      { label: '2', value: 2 },
      { label: '3', value: 3 },
    ]);
  });
});
