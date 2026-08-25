import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { TN_CALENDAR_INTL, type TnCalendarIntl } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { provideTnCalendarIntl } from 'app/core/providers/tn-calendar-intl.provider';

describe('provideTnCalendarIntl', () => {
  let langChange$: Subject<LangChangeEvent>;
  let instantSpy: jest.Mock;

  function setup(): Signal<Partial<TnCalendarIntl>> {
    langChange$ = new Subject<LangChangeEvent>();
    instantSpy = jest.fn((key: string) => `${key}-en`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            onLangChange: langChange$.asObservable(),
            instant: instantSpy,
          },
        },
        provideTnCalendarIntl(),
      ],
    });

    return TestBed.inject(TN_CALENDAR_INTL) as Signal<Partial<TnCalendarIntl>>;
  }

  it('translates the wording the calendar speaks', () => {
    const intl = setup()();

    expect(intl.marked).toBe('(marked)-en');
    expect(intl.previousMonth).toBe('Previous month-en');
    expect(intl.nextMonth).toBe('Next month-en');
    expect(intl.chooseMonthAndYear).toBe('Choose month and year-en');
  });

  it('interpolates the span of years into the year view labels', () => {
    const intl = setup()();

    expect(intl.yearGridLabel?.(2020, 2043)).toBe('Years {startYear} to {endYear}-en');
    expect(instantSpy).toHaveBeenCalledWith('Years {startYear} to {endYear}', { startYear: 2020, endYear: 2043 });
    expect(instantSpy).toHaveBeenCalledWith('Previous {years} years', { years: 24 });
    expect(instantSpy).toHaveBeenCalledWith('Next {years} years', { years: 24 });
  });

  it('leaves monthGridLabel to the library default, which needs no translation', () => {
    expect(setup()().monthGridLabel).toBeUndefined();
  });

  it('recomputes the wording when TranslateService emits onLangChange', () => {
    const intl = setup();
    expect(intl().marked).toBe('(marked)-en');

    instantSpy.mockImplementation((key: string) => `${key}-fr`);
    langChange$.next({ lang: 'fr', translations: {} });

    expect(intl().marked).toBe('(marked)-fr');
    expect(intl().previousMonth).toBe('Previous month-fr');
  });
});
