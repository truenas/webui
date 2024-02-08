import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmartTestResults, SmartTestResultsRow } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { stateButtonColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
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
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      sortable: true,
    }),
    stateButtonColumn({
      title: this.translate.instant('Status'),
      propertyName: 'status',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Remaining'),
      propertyName: 'remaining',
      sortable: true,
      getValue: (row) => {
        return row.remaining || row.status_verbose;
      },
    }),
    textColumn({
      title: this.translate.instant('Lifetime'),
      propertyName: 'lifetime',
      sortable: true,
      getValue: (row) => {
        return row.lifetime || this.translate.instant('N/A');
      },
    }),
    textColumn({
      title: this.translate.instant('Error'),
      propertyName: 'lba_of_first_error',
      sortable: true,
      getValue: (row) => {
        return row.lba_of_first_error || this.translate.instant('No errors');
      },
    }),
  ], {
    rowTestId: (row) => `smart-test-result-${row.disk}-${row.num}`,
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
    this.dataProvider.load();
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
    this.dataProvider.setRows(this.smartTestResults.filter((smartTestResult) => {
      return JSON.stringify(smartTestResult).includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
