import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, signal, OnInit, computed, inject, DestroyRef,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker, TnCardComponent, TnCardHeaderActionsDirective, TnCellDefDirective, TnDialog,
  TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { finalize, forkJoin, of } from 'rxjs';
import {
  catchError,
  filter, tap,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { FibreChannelHost, FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { convertStringToId } from 'app/modules/ix-table/utils';
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
    AsyncPipe,
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
    // Pre-split with lodash kebabCase so digit-bearing values resolve identically through
    // the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
    return kebabCase(convertStringToId('fibre-channel-port-' + row.name));
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
    this.dataProvider.setFilter({
      query,
      // TODO: This should be fixed in dataprovider
      list: this.rows(),
      columnKeys: ['name', 'wwpn', 'wwpn_b'],
    });
  }

  private loadTable(): void {
    this.isLoading.set(true);
    forkJoin([
      this.api.call('fc.fc_host.query'),
      this.api.call('fcport.query'),
      this.api.call('fcport.status'),
    ])
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(this.errorHandler.withErrorHandler()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([hosts, ports, statuses]: [FibreChannelHost[], FibreChannelPort[], FibreChannelStatus[]]) => {
        this.rows.set(buildPortsTableRow(hosts, ports, statuses));
        this.dataProvider.setRows(this.rows());
      });
  }

  protected resolveWwpn(row: FibreChannelPortRow, key: 'wwpn' | 'wwpn_b'): string {
    if (row?.[key]) {
      return row[key];
    }

    const aliasPrefix = row?.host?.alias?.split?.('/')?.[0];
    const isPhysical = row?.name === aliasPrefix;

    if (isPhysical && row?.host?.[key]) {
      return row.host[key];
    }

    return '-';
  }
}
