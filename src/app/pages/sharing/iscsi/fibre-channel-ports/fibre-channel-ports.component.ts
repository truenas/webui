import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, signal, OnInit,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin, of } from 'rxjs';
import {
  catchError,
  filter, tap,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { FibreChannelHost, FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import {
  buildPortsTableRow,
  FibreChannelPortRow,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/build-ports-table-row.utils';
import { fibreChannelPortsElements } from 'app/pages/sharing/iscsi/fibre-channel-ports/fibre-channel-ports.elements';
import {
  VirtualPortsNumberDialogComponent,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/virtual-ports-number-dialog/virtual-ports-number-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-fibre-channel-ports',
  templateUrl: './fibre-channel-ports.component.html',
  styleUrl: './fibre-channel-ports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
    SearchInput1Component,
    TranslateModule,
    UiSearchDirective,
    AsyncPipe,
  ],
})
export class FibreChannelPortsComponent implements OnInit {
  protected readonly searchableElements = fibreChannelPortsElements;
  protected requiredRoles: Role[] = [Role.FullAdmin];
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
        sortBy: (row) => row.name,
      }),
      textColumn({
        title: this.translate.instant('Target'),
        propertyName: 'target',
        getValue: (row) => {
          return row.target?.iscsi_target_name;
        },
      }),
      textColumn({
        title: this.translate.instant('WWPN'),
        propertyName: 'wwpn',
      }),
      textColumn({
        title: this.translate.instant('WWPN (B)'),
        propertyName: 'wwpn_b',
        hidden: !this.isHa(),
      }),
      textColumn({
        title: this.translate.instant('State'),
        getValue: (row) => {
          return `A: ${row.aPortState || '–'} B: ${row.bPortState || '–'}`;
        },
      }),
      actionsColumn({
        actions: [
          {
            iconName: iconMarker('edit'),
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

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private matDialog: MatDialog,
    protected emptyService: EmptyService,
    private errorHandler: ErrorHandlerService,
  ) { }

  ngOnInit(): void {
    this.loadTable();
    this.setDefaultSort();
  }

  doEdit(row: FibreChannelPortRow): void {
    this.matDialog.open(VirtualPortsNumberDialogComponent, { data: row.host })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap(() => this.loadTable()),
        untilDestroyed(this),
      ).subscribe();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      // TODO: This should be fixed in dataprovider
      list: this.rows(),
      columnKeys: ['name', 'wwpn', 'wwpn_b'],
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
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
        catchError(this.errorHandler.catchError()),
        untilDestroyed(this),
      )
      .subscribe(([hosts, ports, statuses]: [FibreChannelHost[], FibreChannelPort[], FibreChannelStatus[]]) => {
        this.rows.set(buildPortsTableRow(hosts, ports, statuses));
        this.dataProvider.setRows(this.rows());
      });
  }
}
