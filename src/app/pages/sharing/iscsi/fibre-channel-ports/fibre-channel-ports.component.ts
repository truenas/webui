import {
  ChangeDetectionStrategy, Component, signal, OnInit, computed, inject, DestroyRef,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker, TnCardComponent, TnCardHeaderActionsDirective, TnCellDefDirective, TnDialog,
  TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { finalize, forkJoin, of } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { FibreChannelHost, FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { dataProviderRows, mapTnSortToTableSort, toUniqueRowTag } from 'app/modules/ix-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  buildPortsTableRow,
  FibreChannelPortRow,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/build-ports-table-row.utils';
import { fibreChannelPortsElements } from 'app/pages/sharing/iscsi/fibre-channel-ports/fibre-channel-ports.elements';
import {
  VirtualPortsNumberDialog,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/virtual-ports-number-dialog/virtual-ports-number-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@Component({
  selector: 'ix-fibre-channel-ports',
  templateUrl: './fibre-channel-ports.component.html',
  styleUrl: './fibre-channel-ports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TnTestIdDirective,
    TranslateModule,
    UiSearchDirective,
  ],
})
export class FibreChannelPortsComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private tnDialog = inject(TnDialog);
  protected emptyService = inject(EmptyService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = fibreChannelPortsElements;
  protected searchQuery = signal<string>('');
  protected dataProvider = new ArrayDataProvider<FibreChannelPortRow>();
  protected readonly currentPage = dataProviderRows(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);
  protected isLoading = signal(false);
  protected isHa = toSignal(this.store$.select(selectIsHaLicensed));

  private rows = signal<FibreChannelPortRow[]>([]);

  protected readonly actions: IconActionConfig<FibreChannelPortRow>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
      hidden: (row) => of(!row.isPhysical),
    },
  ];

  // The WWPN (B) and State columns only apply to HA systems.
  protected readonly displayedColumns = computed<string[]>(() => {
    const columns = ['name', 'target', 'wwpn'];
    if (this.isHa()) {
      columns.push('wwpn_b', 'state');
    }
    columns.push('actions');
    return columns;
  });

  protected readonly trackByPortName = (_index: number, row: FibreChannelPortRow): string => row.name;

  protected uniqueRowTag(row: FibreChannelPortRow): string {
    return toUniqueRowTag('fibre-channel-port-' + row.name);
  }

  protected ariaLabel(row: FibreChannelPortRow): string {
    return [row.name, this.translate.instant('Fibre Channel Port')].join(' ');
  }

  protected portLabel(row: FibreChannelPortRow): string {
    if (row.isPhysical) {
      return row.name;
    }

    return ` – ${this.translate.instant('{port} (virtual)', { port: row.name })}`;
  }

  protected stateLabel(row: FibreChannelPortRow): string {
    return `A: ${row.aPortState || '–'} B: ${row.bPortState || '–'}`;
  }

  protected targetLabel(row: FibreChannelPortRow): string {
    return row.target?.iscsi_target_name || '-';
  }

  protected wwpnLabel(row: FibreChannelPortRow, key: 'wwpn' | 'wwpn_b'): string {
    return row[key] || '-';
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<FibreChannelPortRow>(
      event,
      this.displayedColumns(),
      { sortAccessors: { [event.column]: (row) => this.sortValue(row, event.column) } },
    ));
  }

  /**
   * Every cell is derived from more than the property behind its column — a nested target name, a
   * composed state label — so each is sorted by what it renders. Sorting by the raw row property
   * would order Target by an object and leave State unsorted entirely.
   */
  private sortValue(row: FibreChannelPortRow, column: string): string {
    switch (column) {
      case 'name':
        return portNameSortKey(row.name);
      case 'target':
        return this.targetLabel(row);
      case 'wwpn':
        return this.wwpnLabel(row, 'wwpn');
      case 'wwpn_b':
        return this.wwpnLabel(row, 'wwpn_b');
      case 'state':
        return this.stateLabel(row);
      default:
        return '';
    }
  }

  ngOnInit(): void {
    this.loadTable();
  }

  protected doEdit(row: FibreChannelPortRow): void {
    this.tnDialog.open(VirtualPortsNumberDialog, { data: row.host })
      .closed
      .pipe(
        filter(Boolean),
        tap(() => this.loadTable()),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe();
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.applyFilter();
  }

  /**
   * Re-applies the current search to the loaded rows. Called on reload too, so editing a port
   * doesn't silently drop the filter the user is looking through.
   */
  private applyFilter(): void {
    const query = this.searchQuery();

    if (query) {
      this.dataProvider.setFilter({
        query,
        // TODO: This should be fixed in dataprovider
        list: this.rows(),
        columnKeys: ['name', 'target', 'wwpn', 'wwpn_b'],
        // The Target cell renders a name off a nested object, which the filter can't reach on its own.
        preprocessMap: {
          target: (target) => target?.iscsi_target_name || '',
        },
      });
    } else {
      this.dataProvider.setRows(this.rows());
    }

    // ArrayDataProvider never resolves its own empty type, so without this the table shows the
    // loading placeholder in place of "No Search Results" whenever a search matches nothing.
    this.dataProvider.setEmptyType(this.rows().length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
  }

  private loadTable(): void {
    this.isLoading.set(true);
    this.dataProvider.setEmptyType(EmptyType.Loading);
    forkJoin([
      this.api.call('fc.fc_host.query'),
      this.api.call('fcport.query'),
      this.api.call('fcport.status'),
    ])
      .pipe(
        // `withErrorHandler()` is an operator, not a `catchError` selector — handed to `catchError`
        // it was called with the error itself and threw `error.pipe is not a function`, so a failed
        // query left the page on its loading placeholder with no error dialog.
        tap({ error: () => this.dataProvider.setEmptyType(EmptyType.Errors) }),
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([hosts, ports, statuses]: [FibreChannelHost[], FibreChannelPort[], FibreChannelStatus[]]) => {
        this.rows.set(buildPortsTableRow(hosts, ports, statuses));
        this.applyFilter();
      });
  }
}

/**
 * Orders port names the way they read: `fc2` before `fc10`, and a host's virtual ports right after
 * the host itself. Plain string comparison gets both wrong, so every digit run is zero-padded to a
 * fixed width first.
 */
function portNameSortKey(name: string): string {
  return name.replace(/\d+/g, (digits) => digits.padStart(6, '0'));
}
