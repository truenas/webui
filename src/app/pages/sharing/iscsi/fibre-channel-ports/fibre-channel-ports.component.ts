import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, OnInit, computed, inject, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import { finalize, forkJoin, of } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { FibreChannelHost, FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
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
    FakeProgressBarComponent,
    IxTableBodyComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTablePagerComponent,
    MatCard,
    MatCardContent,
    MatToolbarRow,
    BasicSearchComponent,
    TranslateModule,
    UiSearchDirective,
    AsyncPipe,
  ],
})
export class FibreChannelPortsComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private matDialog = inject(MatDialog);
  protected emptyService = inject(EmptyService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = fibreChannelPortsElements;
  protected searchQuery = signal<string>('');
  protected dataProvider = new ArrayDataProvider<FibreChannelPortRow>();
  protected isLoading = signal(false);
  protected isHa = toSignal(this.store$.select(selectIsHaLicensed));

  private rows = signal<FibreChannelPortRow[]>([]);

  protected columns = computed(() => {
    return createTable<FibreChannelPortRow>([
      textColumn({
        title: this.translate.instant('Port'),
        propertyName: 'name',
        getValue: (row) => {
          if (row.isPhysical) {
            return row.name;
          }

          return ` – ${this.translate.instant('{port} (virtual)', { port: row.name })}`;
        },
        // Sorts by the port name itself rather than the rendered label, which carries a leading
        // dash on virtual ports and would clump them all together away from their host.
        sortBy: (row) => portNameSortKey(row.name),
      }),
      textColumn({
        title: this.translate.instant('Target'),
        propertyName: 'target',
        getValue: (row) => this.targetLabel(row),
      }),
      textColumn({
        title: this.translate.instant('WWPN'),
        propertyName: 'wwpn',
        getValue: (row) => this.wwpnLabel(row, 'wwpn'),
      }),
      textColumn({
        title: this.translate.instant('WWPN (B)'),
        propertyName: 'wwpn_b',
        getValue: (row) => this.wwpnLabel(row, 'wwpn_b'),
        hidden: !this.isHa(),
      }),
      textColumn({
        title: this.translate.instant('State'),
        getValue: (row) => this.stateLabel(row),
        hidden: !this.isHa(),
      }),
      actionsWithMenuColumn({
        disableSorting: true,
        actions: [
          {
            iconName: tnIconMarker('pencil', 'mdi'),
            tooltip: this.translate.instant('Edit'),
            onClick: (row) => this.doEdit(row),
            hidden: (row) => of(!row.isPhysical),
          },
        ],
      }),
    ], {
      uniqueRowTag: (row) => 'fibre-channel-port-' + row.name,
      ariaLabels: (row) => [row.name, this.translate.instant('Fibre Channel Port')],
    });
  });

  ngOnInit(): void {
    this.loadTable();
  }

  doEdit(row: FibreChannelPortRow): void {
    this.matDialog.open(VirtualPortsNumberDialog, { data: row.host })
      .afterClosed()
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

  private targetLabel(row: FibreChannelPortRow): string {
    return row.target?.iscsi_target_name || '-';
  }

  private wwpnLabel(row: FibreChannelPortRow, key: 'wwpn' | 'wwpn_b'): string {
    return row[key] || '-';
  }

  private stateLabel(row: FibreChannelPortRow): string {
    return `A: ${row.aPortState || '–'} B: ${row.bPortState || '–'}`;
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
 * Orders port names the way they read: `fc2` before `fc10`. Plain string comparison orders
 * digit runs lexically and gets that wrong, so every digit run is zero-padded to a fixed width
 * first. Virtual ports stay grouped under their host either way — `/` sorts below every digit.
 */
function portNameSortKey(name: string): string {
  return name.replace(/\d+/g, (digits) => digits.padStart(6, '0'));
}
