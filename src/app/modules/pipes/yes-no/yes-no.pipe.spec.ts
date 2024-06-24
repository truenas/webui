import { TranslateService } from '@ngx-translate/core';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';

describe('YesNoPipe', () => {
  const pipe = new YesNoPipe({
    instant: (key: string) => key,
  } as TranslateService);

  it('transforms boolean value to "Yes" or "No"', () => {
    expect(pipe.transform(true)).toBe('Yes');
    expect(pipe.transform(false)).toBe('No');
  });
});
