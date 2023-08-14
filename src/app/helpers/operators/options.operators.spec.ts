import { lastValueFrom, of } from 'rxjs';
import {
  arrayToOptions,
  choicesToOptions,
  idNameArrayToOptions,
  singleArrayToOptions,
} from 'app/helpers/operators/options.operators';

describe('choicesToOptions', () => {
  it('converts key-value objects to an array of options', async () => {
    const choices = {
      key1: 'label1',
      key2: 'label2',
    };

    const options = await lastValueFrom(of(choices).pipe(choicesToOptions()));

    expect(options).toEqual([
      { label: 'label1', value: 'key1' },
      { label: 'label2', value: 'key2' },
    ]);
  });
});

describe('arrayToOptions', () => {
  it('converts array of labels and values to array of options', async () => {
    const array = [['value1', 'label1'], ['value2', 'label2']];

    const options = await lastValueFrom(of(array).pipe(arrayToOptions()));

    expect(options).toEqual([
      { label: 'label1', value: 'value1' },
      { label: 'label2', value: 'value2' },
    ]);
  });
});

describe('singleArrayToOptions', () => {
  it('converts array of strings to an array of options', async () => {
    const array = ['value1', 'value2'];

    const options = await lastValueFrom(of(array).pipe(singleArrayToOptions()));

    expect(options).toEqual([
      { label: 'value1', value: 'value1' },
      { label: 'value2', value: 'value2' },
    ]);
  });
});

describe('idNameArrayToOptions', () => {
  it('converts array of objects with id and name to an array of options', async () => {
    const array = [
      { id: 1, name: 'name1' },
      { id: 2, name: 'name2' },
    ];

    const options = await lastValueFrom(of(array).pipe(idNameArrayToOptions()));

    expect(options).toEqual([
      { label: 'name1', value: 1 },
      { label: 'name2', value: 2 },
    ]);
  });
});
