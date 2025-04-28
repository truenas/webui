import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { TranslateOptionsPipe } from 'app/modules/translate/translate-options/translate-options.pipe';

describe('TranslateOptionsPipe', () => {
  let pipe: TranslateOptionsPipe;

  beforeEach(() => {
    pipe = new TranslateOptionsPipe({
      instant: jest.fn((key: string) => `Translated ${key}`),
    } as unknown as TranslateService);
  });

  it('should transform options by calling translateOptions helper', async () => {
    const options$ = of([
      { label: 'Option 1', value: 1 },
      { label: 'Option 2', value: 2 },
    ]);

    const result$ = pipe.transform(options$);

    const result = await firstValueFrom(result$);

    expect(result).toEqual([
      { label: 'Translated Option 1', value: 1 },
      { label: 'Translated Option 2', value: 2 },
    ]);
  });
});
