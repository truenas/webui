import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { TN_TABLE_PAGER_LABELS, type TnTablePagerLabels } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { provideTnTablePagerLabels } from 'app/core/providers/tn-table-pager-labels.provider';

describe('provideTnTablePagerLabels', () => {
  let langChange$: Subject<LangChangeEvent>;
  let instantSpy: jest.Mock;

  function setup(): Signal<TnTablePagerLabels> {
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
});
