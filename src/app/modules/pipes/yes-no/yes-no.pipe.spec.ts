import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';

describe('YesNoPipe', () => {
  let pipe: YesNoPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        YesNoPipe,
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
          },
        },
      ],
    });
    pipe = TestBed.inject(YesNoPipe);
  });

  it('transforms boolean value to "Yes" or "No"', () => {
    expect(pipe.transform(true)).toBe('Yes');
    expect(pipe.transform(false)).toBe('No');
  });
});
