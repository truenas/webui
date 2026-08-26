import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective, TnCardHeaderDirective, TnCellDefDirective,
  TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbNotificationInfo } from 'app/interfaces/smb-status.interface';
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

@Component({
  selector: 'ix-smb-notification-list',
  templateUrl: './smb-notification-list.component.html',
  styleUrls: ['./smb-notification-list.component.scss'],
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
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class SmbNotificationListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  searchQuery = signal('');
  private readonly smbStatus$ = this.api.call('smb.status', [SmbInfoLevel.Notifications]).pipe(
    tap((shares: SmbNotificationInfo[]) => {
      this.notifications = shares;
      if (this.searchQuery()) {
        this.onListFiltered(this.searchQuery());
      }
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  dataProvider = new AsyncDataProvider<SmbNotificationInfo>(this.smbStatus$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);
  notifications: SmbNotificationInfo[] = [];

  protected readonly columns = signal(createTable<SmbNotificationInfo>([
    column({ title: this.translate.instant('Path'), propertyName: 'path' }),
    column({ title: this.translate.instant('Filter'), propertyName: 'filter' }),
    column({ title: this.translate.instant('Subdir Filter'), propertyName: 'subdir_filter' }),
    column({ title: this.translate.instant('Creation Time'), propertyName: 'creation_time' }),
  ]));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly trackByNotification = (_index: number, row: SmbNotificationInfo): string => {
    return `${row.creation_time}-${row.server_id.unique_id}`;
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
    this.dataProvider.setFilter({
      query,
      columnKeys: ['path', 'filter', 'subdir_filter', 'creation_time'],
    });
  }

  protected uniqueRowTag(row: SmbNotificationInfo): string {
    return normalizeTestIdString(
      convertStringToId('smb-notification-' + row.creation_time + '-' + row.server_id.unique_id),
    );
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
    this.cdr.markForCheck();
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort<SmbNotificationInfo>(event, this.displayedColumns(), { columns: this.columns() }),
    );
  }
}
