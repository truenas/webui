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
import { SmbSession } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-smb-session-list',
  templateUrl: './smb-session-list.component.html',
  styleUrls: ['./smb-session-list.component.scss'],
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
export class SmbSessionListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  searchQuery = signal('');
  dataProvider: AsyncDataProvider<SmbSession>;
  sessions: SmbSession[] = [];

  protected readonly columns = signal(createTable<SmbSession>([
    textColumn({ title: this.translate.instant('Session ID'), propertyName: 'session_id' }),
    textColumn({ title: this.translate.instant('Hostname'), propertyName: 'hostname' }),
    textColumn({ title: this.translate.instant('Remote machine'), propertyName: 'remote_machine' }),
    textColumn({ title: this.translate.instant('Username'), propertyName: 'username' }),
    textColumn({ title: this.translate.instant('Groupname'), propertyName: 'groupname' }),
    textColumn({ title: this.translate.instant('UID'), propertyName: 'uid' }),
    textColumn({ title: this.translate.instant('GID'), propertyName: 'gid' }),
    textColumn({ title: this.translate.instant('Session dialect'), propertyName: 'session_dialect' }),
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
    uniqueRowTag: (row) => 'smb-session-' + row.session_id,
    ariaLabels: (row) => [row.hostname, this.translate.instant('SMB Session')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly trackBySession = (_index: number, row: SmbSession): string => row.session_id;

  ngOnInit(): void {
    const smbStatus$ = this.api.call('smb.status', [SmbInfoLevel.Sessions]).pipe(
      tap((sessions: SmbSession[]) => {
        this.sessions = sessions;
        if (this.searchQuery()) {
          this.onListFiltered(this.searchQuery());
        }
      }),
      takeUntilDestroyed(this.destroyRef),
    );

    this.dataProvider = new AsyncDataProvider<SmbSession>(smbStatus$);
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
      columnKeys: ['server_id', 'hostname', 'remote_machine', 'username', 'groupname', 'uid', 'gid', 'session_dialect'],
    });
  }

  protected uniqueRowTag(row: SmbSession): string {
    return convertStringToId('smb-session-' + row.session_id);
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
    this.cdr.markForCheck();
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<SmbSession>(event, this.displayedColumns()));
  }
}
