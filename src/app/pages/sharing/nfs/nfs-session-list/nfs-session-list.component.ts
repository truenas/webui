import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnButtonToggleComponent, TnButtonToggleGroupComponent, TnCellDefDirective,
  TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { combineLatest, map, tap } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { stringToTitleCase } from 'app/helpers/string-to-title-case';
import { Nfs3Session, Nfs4Session, NfsType } from 'app/interfaces/nfs-share.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import {
  convertStringToId, createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns,
} from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { nfsSessionListElements } from 'app/pages/sharing/nfs/nfs-session-list/nfs-session-list.elements';

let nextLabelId = 0;

@Component({
  selector: 'ix-nfs-session-list',
  templateUrl: './nfs-session-list.component.html',
  styleUrls: ['./nfs-session-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    FormsModule,
    TnButtonToggleGroupComponent,
    TnButtonToggleComponent,
    BasicSearchComponent,
    TnButtonComponent,
    TnTestIdDirective,
    TableColumnPickerComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    UiSearchDirective,
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class NfsSessionListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly activeNfsType = signal<NfsType>(NfsType.Nfs3);
  protected readonly searchableElements = nfsSessionListElements;
  protected readonly nfsTypeToggleLabelId = `nfs-type-toggle-label-${nextLabelId++}`;

  protected readonly searchQuery = signal('');
  private sessions: Nfs3Session[] | Nfs4Session['info'][] = [];
  protected readonly NfsType = NfsType;

  protected readonly nfs3Columns = signal(createTable<Nfs3Session>([
    textColumn({
      title: this.translate.instant('IP'),
      propertyName: 'ip',
    }),
    textColumn({
      title: this.translate.instant('Export'),
      propertyName: 'export',
    }),
  ]));

  protected readonly nfs4Columns = signal(createTable<Nfs4Session['info']>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Client ID'),
      propertyName: 'clientid',
    }),
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    textColumn({
      title: this.translate.instant('Status'),
      propertyName: 'status',
    }),
    textColumn({
      title: this.translate.instant('Seconds From Last Renew'),
      propertyName: 'seconds from last renew',
    }),
    textColumn({
      title: this.translate.instant('Minor Version'),
      propertyName: 'minor version',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Implementation Domain'),
      hidden: true,
      propertyName: 'Implementation domain',
    }),
    textColumn({
      title: this.translate.instant('Implementation Name'),
      hidden: true,
      propertyName: 'Implementation name',
    }),
    textColumn({
      title: this.translate.instant('Callback State'),
      hidden: true,
      propertyName: 'callback state',
    }),
    textColumn({
      title: this.translate.instant('Callback Address'),
      propertyName: 'callback address',
      hidden: true,
    }),
  ]));

  protected readonly nfs3DisplayedColumns = computed(() => toDisplayedColumns(this.nfs3Columns()));
  protected readonly nfs4DisplayedColumns = computed(() => toDisplayedColumns(this.nfs4Columns()));

  protected readonly trackByNfs3 = (_index: number, row: Nfs3Session): string => `${row.export}-${row.ip}`;
  protected readonly trackByNfs4 = (_index: number, row: Nfs4Session['info']): string => `${row.address}-${row.clientid}`;

  private readonly nfs3ProviderRequest$ = this.api.call('nfs.get_nfs3_clients', []).pipe(
    tap((sessions) => {
      this.sessions = sessions;
      if (this.searchQuery()) {
        this.onListFiltered(this.searchQuery());
      }
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly nfs3DataProvider = new AsyncDataProvider<Nfs3Session>(this.nfs3ProviderRequest$);
  protected readonly nfs3Rows = dataProviderRows(this.nfs3DataProvider);
  protected readonly nfs3Loading = dataProviderLoading(this.nfs3DataProvider);
  protected readonly nfs3EmptyType = toSignal(this.nfs3DataProvider.emptyType$);

  private readonly nfs4ProviderRequest$ = this.api.call('nfs.get_nfs4_clients', []).pipe(
    map((sessions) => sessions.map((session) => session.info)),
    tap((sessions) => {
      this.sessions = sessions;
      if (this.searchQuery()) {
        this.onListFiltered(this.searchQuery());
      }
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly nfs4DataProvider = new AsyncDataProvider<Nfs4Session['info']>(this.nfs4ProviderRequest$);
  protected readonly nfs4Rows = dataProviderRows(this.nfs4DataProvider);
  protected readonly nfs4Loading = dataProviderLoading(this.nfs4DataProvider);
  protected readonly nfs4EmptyType = toSignal(this.nfs4DataProvider.emptyType$);

  protected formatStatus(status: string): string {
    return stringToTitleCase(status);
  }

  // Pre-split with lodash kebabCase ('nfs3' → 'nfs-3'): the library's [tnTestId] kebab does
  // not break letter–digit boundaries, so pre-splitting keeps the resolved data-test values
  // byte-identical to the legacy [ixTest] directive's lodash normalization.
  protected uniqueRowTag3(row: Nfs3Session): string {
    return kebabCase(convertStringToId('nfs3-session-' + row.export + '-' + row.ip));
  }

  protected uniqueRowTag4(row: Nfs4Session['info']): string {
    return kebabCase(convertStringToId(`nfs4-session-${row.address}-${row.clientid}`));
  }

  ngOnInit(): void {
    this.loadData();

    combineLatest([this.nfs3DataProvider.emptyType$, this.nfs4DataProvider.emptyType$])
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.onListFiltered(this.searchQuery());
      });
  }

  protected nfsTypeChanged(value: NfsType): void {
    if (this.activeNfsType() === value) {
      return;
    }

    this.activeNfsType.set(value === NfsType.Nfs4 ? NfsType.Nfs4 : NfsType.Nfs3);
    this.loadData();
  }

  protected loadData(): void {
    if (this.activeNfsType() === NfsType.Nfs3) {
      this.nfs3DataProvider.load();
    } else {
      this.nfs4DataProvider.load();
    }
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query?.toString()?.toLowerCase());

    if (this.activeNfsType() === NfsType.Nfs3) {
      this.filterNfs3Data();
    } else {
      this.filterNfs4Data();
    }
  }

  protected onColumnsChange(columns: ReturnType<typeof this.nfs3Columns> | ReturnType<typeof this.nfs4Columns>): void {
    if (this.activeNfsType() === NfsType.Nfs3) {
      this.nfs3Columns.set([...columns as ReturnType<typeof this.nfs3Columns>]);
    } else {
      this.nfs4Columns.set([...columns as ReturnType<typeof this.nfs4Columns>]);
    }
  }

  protected onNfs3SortChange(event: TnSortEvent): void {
    this.nfs3DataProvider.setSorting(mapTnSortToTableSort<Nfs3Session>(event, this.nfs3DisplayedColumns()));
  }

  protected onNfs4SortChange(event: TnSortEvent): void {
    this.nfs4DataProvider.setSorting(mapTnSortToTableSort<Nfs4Session['info']>(event, this.nfs4DisplayedColumns()));
  }

  private filterNfs3Data(): void {
    this.nfs3DataProvider.setFilter({
      list: this.sessions as Nfs3Session[],
      query: this.searchQuery(),
      columnKeys: ['export', 'ip'],
    });
  }

  private filterNfs4Data(): void {
    this.nfs4DataProvider.setFilter({
      list: this.sessions as Nfs4Session['info'][],
      query: this.searchQuery(),
      columnKeys: ['name', 'clientid', 'address', 'status', 'seconds from last renew'],
    });
  }
}
