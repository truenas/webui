import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective, TnCardHeaderDirective, TnCellDefDirective,
  TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, type TnSortEvent,
} from '@truenas/ui-components';
import { tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbShareInfo } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-smb-share-list',
  templateUrl: './smb-share-list.component.html',
  styleUrls: ['./smb-share-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TableColumnPickerComponent,
    TnButtonComponent,
    TestDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SmbShareListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  searchQuery = signal('');
  dataProvider: AsyncDataProvider<SmbShareInfo>;
  shares: SmbShareInfo[] = [];

  protected readonly columns = signal(createTable<SmbShareInfo>([
    textColumn({ title: this.translate.instant('Service'), propertyName: 'service' }),
    textColumn({ title: this.translate.instant('Session ID'), propertyName: 'session_id' }),
    textColumn({ title: this.translate.instant('Machine'), propertyName: 'machine' }),
    textColumn({ title: this.translate.instant('Connected at'), propertyName: 'connected_at' }),
    textColumn({
      title: this.translate.instant('Encryption'),
      propertyName: 'encryption',
      getValue: (row) => row.encryption.cipher,
    }),
    textColumn({
      title: this.translate.instant('Signing'),
      propertyName: 'signing',
      getValue: (row) => row.signing.cipher,
    }),
  ], {
    uniqueRowTag: (row) => 'smb-share-' + row.server_id.unique_id + '-' + row.machine,
    ariaLabels: (row) => [row.machine, this.translate.instant('SMB Share')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly trackByShare = (_index: number, row: SmbShareInfo): string => {
    return `${row.server_id.unique_id}-${row.machine}`;
  };

  ngOnInit(): void {
    const smbStatus$ = this.api.call('smb.status', [SmbInfoLevel.Shares]).pipe(
      tap((shares: SmbShareInfo[]) => {
        this.shares = shares;
        if (this.searchQuery()) {
          this.onListFiltered(this.searchQuery());
        }
      }),
      takeUntilDestroyed(this.destroyRef),
    );

    this.dataProvider = new AsyncDataProvider<SmbShareInfo>(smbStatus$);
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
      columnKeys: ['session_id', 'service', 'machine', 'connected_at'],
    });
  }

  protected uniqueRowTag(row: SmbShareInfo): string {
    return convertStringToId('smb-share-' + row.server_id.unique_id + '-' + row.machine);
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
    this.cdr.markForCheck();
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<SmbShareInfo>(event, this.displayedColumns()));
  }
}
