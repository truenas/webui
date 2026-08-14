import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective, TnCardHeaderDirective, TnCellDefDirective,
  TnDetailRowDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent,
  TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import {
  convertStringToId, createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns,
} from 'app/modules/tn-table/utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { SmbOpenFilesComponent } from 'app/pages/sharing/smb/smb-status/components/smb-open-files/smb-open-files.component';

@Component({
  selector: 'ix-smb-lock-list',
  templateUrl: './smb-lock-list.component.html',
  styleUrls: ['./smb-lock-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TableColumnPickerComponent,
    TnButtonComponent,
    TnTestIdDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    SmbOpenFilesComponent,
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class SmbLockListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  searchQuery = signal('');
  private readonly smbStatus$ = this.api.call('smb.status', [SmbInfoLevel.Locks]).pipe(
    tap((locks: SmbLockInfo[]) => {
      this.locks = locks;
      if (this.searchQuery()) {
        this.onListFiltered(this.searchQuery());
      }
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  dataProvider = new AsyncDataProvider<SmbLockInfo>(this.smbStatus$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);
  locks: SmbLockInfo[] = [];
  files: SmbOpenInfo[] = [];

  protected readonly columns = signal(createTable<SmbLockInfo>([
    column({ title: this.translate.instant('Path'), propertyName: 'service_path' }),
    column({ title: this.translate.instant('Filename'), propertyName: 'filename' }),
    column({
      title: this.translate.instant('File ID'),
      propertyName: 'fileid',
      getValue: (row) => {
        return Object.values(row.fileid).join(':');
      },
      // The rendered id is a colon-joined numeric triple, so sorting the text puts "10:5:0"
      // before "2:9:0". Order by the parts numerically, most significant first.
      sortBy: (row) => [row.fileid.devid, row.fileid.inode, row.fileid.extid]
        .map((part) => String(part).padStart(20, '0'))
        .join(':'),
    }),
    column({
      title: this.translate.instant('Open Files'),
      propertyName: 'opens',
      getValue: (row) => {
        return this.translate.instant('{n, plural, =0 {No open files} one {# open file} other {# open files}}', { n: Object.keys(row.opens).length });
      },
      // Sort by the count, not by the pluralized text — otherwise "10 open files" sorts
      // before "2 open files".
      sortBy: (row) => Object.keys(row.opens).length,
    }),
    column({
      title: this.translate.instant('Num Pending Deletes'),
      propertyName: 'num_pending_deletes',
    }),
  ]));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly trackByLock = (_index: number, row: SmbLockInfo): string => {
    return `${row.filename}-${row.fileid.devid}-${row.fileid.extid}`;
  };

  ngOnInit(): void {
    this.loadData();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected loadData(): void {
    this.dataProvider.load();
  }

  onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['filename', 'service_path'] });
  }

  protected getFileId(row: SmbLockInfo): string {
    return Object.values(row.fileid).join(':');
  }

  protected getOpenFilesLabel(row: SmbLockInfo): string {
    return this.translate.instant(
      '{n, plural, =0 {No open files} one {# open file} other {# open files}}',
      { n: Object.keys(row.opens).length },
    );
  }

  protected uniqueRowTag(row: SmbLockInfo): string {
    return normalizeTestIdString(
      convertStringToId(`smb-lock-${row.filename}-${row.fileid.devid}-${row.fileid.extid}`),
    );
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
    this.cdr.markForCheck();
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort<SmbLockInfo>(event, this.displayedColumns(), { columns: this.columns() }),
    );
  }
}
