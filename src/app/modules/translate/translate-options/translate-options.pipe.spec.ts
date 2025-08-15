import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { TranslateOptionsPipe } from 'app/modules/translate/translate-options/translate-options.pipe';

describe('TranslateOptionsPipe', () => {
  let pipe: TranslateOptionsPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TranslateOptionsPipe,
        {
          provide: TranslateService,
          useValue: {
            instant: jest.fn((key: string) => `Translated ${key}`),
          },
        },
      ],
    });

    pipe = TestBed.inject(TranslateOptionsPipe);
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
