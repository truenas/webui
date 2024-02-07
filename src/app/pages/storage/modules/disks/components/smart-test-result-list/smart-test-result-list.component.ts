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
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './smart-test-result-list.component.html',
  styleUrls: ['./smart-test-result-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartTestResultListComponent implements OnInit {
  @Input() type: SmartTestResultPageType;
  @Input() pk: string;
  queryParams: QueryParams<SmartTestResults> = [];
  disks: Disk[] = [];
  smartTestResults: SmartTestResultsRow[];
  filterString = '';
  dataProvider: AsyncDataProvider<SmartTestResultsRow>;
  protected readonly requiredRoles = [Role.FullAdmin];

  columns = createTable<SmartTestResultsRow>([
    textColumn({
      title: this.translate.instant('ID'),
      propertyName: 'id',
      sortable: true,
    }),
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
    textColumn({
      title: this.translate.instant('Status'),
      propertyName: 'status',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Remaining'),
      propertyName: 'remaining',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Lifetime'),
      propertyName: 'lifetime',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Error'),
      propertyName: 'lba_of_first_error',
      sortable: true,
    }),
  ], {
    rowTestId: (row) => 'smart-test-result-' + row.id,
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
    this.updateQueryParams();
    this.createDataProvider();
  }

  createDataProvider(): void {
    const smartTestResults$ = this.ws.call('disk.query', [[], { extra: { pools: true } }]).pipe(
      switchMap((disks) => {
        this.disks = disks;
        return this.ws.call('smart.test.results', this.queryParams);
      }),
      map((smartTestResults: SmartTestResults[]) => {
        const rows: SmartTestResultsRow[] = [];
        smartTestResults.forEach((smartTestResult) => {
          smartTestResult?.tests.forEach((test, id) => {
            rows.push({ ...test, disk: smartTestResult.disk, id });
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

  updateQueryParams(): void {
    switch (this.type) {
      case SmartTestResultPageType.Disk:
        this.queryParams = [[['disk', '=', this.pk]]];
        break;
      case SmartTestResultPageType.Pool:
        this.queryParams = [[['disk', 'in', this.diskNames]]];
        break;
      default:
        break;
    }
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.smartTestResults.filter((smartTestResult) => {
      return smartTestResult.description.includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
