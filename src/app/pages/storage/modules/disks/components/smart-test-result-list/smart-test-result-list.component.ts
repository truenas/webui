import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmartTestResults, SmartTestResultsRow } from 'app/interfaces/smart-test.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smart-test-result-list',
  templateUrl: './smart-test-result-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    IxTableColumnsSelectorComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
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
        if (typeof row.remaining === 'number' && row.remaining >= 0) {
          return `${row.remaining}%`;
        }

        return row.status_verbose ? this.translate.instant(row.status_verbose) : '0%';
      },
    }),
    textColumn({
      title: this.translate.instant('Power On Hours Ago'),
      propertyName: 'power_on_hours_ago',
      headerTooltip: this.translate.instant('"Power On Hours" are how many hours have passed while the disk has been powered on. "Power On Hours Ago" is how many power on hours have passed since each test.'),
      getValue: (row) => {
        return row.power_on_hours_ago || this.translate.instant('N/A');
      },
    }),
    textColumn({
      title: this.translate.instant('LBA of First Error'),
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
