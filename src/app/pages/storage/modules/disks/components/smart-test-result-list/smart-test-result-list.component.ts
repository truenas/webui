import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmartTestResults, SmartTestResultsRow } from 'app/interfaces/smart-test.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smart-test-result-list',
  templateUrl: './smart-test-result-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartTestResultListComponent implements OnInit {
  @Input() type: SmartTestResultPageType;
  @Input() pk: string;
  disks: Disk[] = [];
  smartTestResults: SmartTestResultsRow[];
  filterString = '';
  dataProvider: AsyncDataProvider<SmartTestResultsRow>;
  protected readonly requiredRoles = [Role.FullAdmin];

  columns = createTable<SmartTestResultsRow>([
    textColumn({
      title: this.translate.instant('Disk'),
      propertyName: 'disk',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    stateButtonColumn({
      title: this.translate.instant('Status'),
      propertyName: 'status',
    }),
    textColumn({
      title: this.translate.instant('Remaining'),
      propertyName: 'remaining',
      getValue: (row) => {
        return row.remaining || row.status_verbose;
      },
    }),
    textColumn({
      title: this.translate.instant('Lifetime'),
      propertyName: 'lifetime',
      getValue: (row) => {
        return row.lifetime || this.translate.instant('N/A');
      },
    }),
    textColumn({
      title: this.translate.instant('Error'),
      propertyName: 'lba_of_first_error',
      getValue: (row) => {
        return row.lba_of_first_error || this.translate.instant('No errors');
      },
    }),
  ], {
    uniqueRowTag: (row) => `smart-test-result-${row.disk}-${row.num}`,
    ariaLabels: (row) => [row.disk, this.translate.instant('Smart Test Result')],
  });

  get hiddenColumns(): Column<SmartTestResultsRow, ColumnComponent<SmartTestResultsRow>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  get diskNames(): string[] {
    return this.disks.filter((disk) => disk.pool === this.pk).map((disk) => disk.name);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.createDataProvider();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  createDataProvider(): void {
    const smartTestResults$ = this.ws.call('disk.query', [[], { extra: { pools: true } }]).pipe(
      switchMap((disks) => {
        this.disks = disks;
        const queryParams: QueryParams<SmartTestResults> = this.type === SmartTestResultPageType.Disk
          ? [[['disk', '=', this.pk]]]
          : [[['disk', 'in', this.diskNames]]];
        return this.ws.call('smart.test.results', queryParams);
      }),
      map((smartTestResults: SmartTestResults[]) => {
        const rows: SmartTestResultsRow[] = [];
        smartTestResults.forEach((smartTestResult) => {
          smartTestResult?.tests.forEach((test) => {
            rows.push({ ...test, disk: smartTestResult.disk });
          });
        });
        return rows;
      }),
      tap((smartTestResults) => this.smartTestResults = smartTestResults),
    );
    this.dataProvider = new AsyncDataProvider<SmartTestResultsRow>(smartTestResults$);
    this.refresh();
    this.setDefaultSort();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'disk',
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.smartTestResults.length
        ? []
        : Object.keys(this.smartTestResults[0]) as (keyof SmartTestResultsRow)[],
    });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
