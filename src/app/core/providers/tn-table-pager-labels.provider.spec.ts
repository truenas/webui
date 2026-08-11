import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent, TranslateService,
} from '@ngx-translate/core';
import { TN_TABLE_PAGER_LABELS, type TnTablePagerLabels } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { provideTnTablePagerLabels } from 'app/core/providers/tn-table-pager-labels.provider';

describe('provideTnTablePagerLabels', () => {
  let langChange$: Subject<LangChangeEvent>;
  let translationChange$: Subject<TranslationChangeEvent>;
  let defaultLangChange$: Subject<DefaultLangChangeEvent>;
  let instantSpy: jest.Mock;

  function setup(): Signal<TnTablePagerLabels> {
    langChange$ = new Subject<LangChangeEvent>();
    translationChange$ = new Subject<TranslationChangeEvent>();
    defaultLangChange$ = new Subject<DefaultLangChangeEvent>();
    instantSpy = jest.fn((key: string) => `${key}-en`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          // All three streams, not just `onLangChange`: `translated` merges the same set the
          // `translate` pipe subscribes to, so a mock missing any of them is not a TranslateService.
          useValue: {
            onLangChange: langChange$.asObservable(),
            onTranslationChange: translationChange$.asObservable(),
            onDefaultLangChange: defaultLangChange$.asObservable(),
            instant: instantSpy,
          },
        },
        provideTnTablePagerLabels(),
      ],
    });

    return TestBed.inject(TN_TABLE_PAGER_LABELS) as Signal<TnTablePagerLabels>;
  }

  it('exposes a translated value for every TnTablePagerLabels key', () => {
    const labels = setup()();

    expect(labels).toEqual({
      itemsPerPage: 'Items per page-en',
      of: 'of-en',
      firstPage: 'First Page-en',
      previousPage: 'Previous Page-en',
      nextPage: 'Next Page-en',
      lastPage: 'Last Page-en',
      tablePagination: 'Table Pagination-en',
    });
  });

  it('recomputes labels when TranslateService emits onLangChange', () => {
    const labelsSignal = setup();
    expect(labelsSignal().itemsPerPage).toBe('Items per page-en');

    instantSpy.mockImplementation((key: string) => `${key}-fr`);
    langChange$.next({ lang: 'fr', translations: {} });

    expect(labelsSignal().itemsPerPage).toBe('Items per page-fr');
    expect(labelsSignal().tablePagination).toBe('Table Pagination-fr');
  });

  it('recomputes labels when a bundle is merged after construction', () => {
    const labelsSignal = setup();
    expect(labelsSignal().itemsPerPage).toBe('Items per page-en');

    // The lazy-load case: the language never changes, the bundle for it just arrives late.
    instantSpy.mockImplementation((key: string) => `${key}-loaded`);
    translationChange$.next({ lang: 'en', translations: {} });

    expect(labelsSignal().itemsPerPage).toBe('Items per page-loaded');
  });
});
