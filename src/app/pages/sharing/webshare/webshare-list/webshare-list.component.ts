import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, switchMap, of, map, combineLatest, catchError, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { webShareListNameColumn } from 'app/pages/sharing/webshare/webshare-list/webshare-name-cell/webshare-name-cell.component';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

export interface WebShareTableRow {
  name: string;
  path: string;
  search_indexed: boolean;
  is_home_base: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-webshare-list',
  templateUrl: './webshare-list.component.html',
  styleUrls: ['./webshare-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    ServiceStateButtonComponent,
    SearchInput1Component,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    EmptyComponent,
    TranslateModule,
    AsyncPipe,
    IxIconComponent,
  ],
})
export class WebShareListComponent implements OnInit {
  readonly requiredRoles = [Role.SharingWrite];
  readonly EmptyType = EmptyType;

  service$ = this.store$.select(selectService(ServiceName.WebShare));
  filterString = '';
  dataProvider: AsyncDataProvider<WebShareTableRow>;

  hasValidLicense$ = combineLatest([
    this.store$.pipe(
      waitForSystemInfo,
      map((systemInfo) => systemInfo.license !== null),
    ),
    this.api.call('tn_connect.config').pipe(
      map((config: TruenasConnectConfig) => config?.status === TruenasConnectStatus.Configured),
      catchError(() => of(false)),
    ),
  ]).pipe(
    map(([hasLicense, tnConnectConfigured]) => hasLicense || tnConnectConfigured),
  );

  protected readonly helptext = helptextSharingWebshare;

  readonly emptyConfig = {
    type: EmptyType.NoPageData,
    title: this.translate.instant('No WebShares configured'),
    message: this.translate.instant('Click the "Add" button to create a WebShare.'),
    buttonText: this.translate.instant('Add WebShare'),
    buttonAction: () => this.doAdd(),
    requiredRoles: this.requiredRoles,
  };

  columns = createTable<WebShareTableRow>([
    webShareListNameColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('WebShare')],
  });

  constructor(
    private api: ApiService,
    private slideIn: SlideIn,
    private translate: TranslateService,
    private dialog: DialogService,
    private router: Router,
    private snackbar: SnackbarService,
    protected emptyService: EmptyService,
    private store$: Store<AppState>,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.setDataProvider();
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({
      query,
      columnKeys: ['name', 'path'],
    });
  }

  doAdd(): void {
    this.hasValidLicense$.pipe(
      take(1),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      const slideInRef$ = this.slideIn.open(WebShareSharesFormComponent, {
        data: {
          isNew: true,
          name: '',
          path: '',
          search_indexed: true,
          is_home_base: false,
        },
      });

      slideInRef$
        .pipe(filter((result) => result?.response), untilDestroyed(this))
        .subscribe(() => {
          this.loadWebShareConfig();
        });
    });
  }

  doEdit(row: WebShareTableRow): void {
    const slideInRef$ = this.slideIn.open(WebShareSharesFormComponent, {
      data: {
        isNew: false,
        name: row.name,
        path: row.path,
        search_indexed: row.search_indexed,
        is_home_base: row.is_home_base,
      },
    });

    slideInRef$
      .pipe(filter((result) => result?.response), untilDestroyed(this))
      .subscribe(() => {
        this.loadWebShareConfig();
      });
  }

  doDelete(row: WebShareTableRow): void {
    this.dialog.confirm({
      title: this.translate.instant(this.helptext.delete_dialog_title),
      message: this.translate.instant(this.helptext.delete_dialog_message, {
        name: row.name,
        path: row.path,
      }),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.call('webshare.config')),
        switchMap((config: WebShareConfig) => {
          if (!config?.shares) {
            return of(null);
          }

          // Filter out the share to delete
          const updatedShares = config.shares.filter(
            (share) => share.name !== row.name,
          );

          return this.api.call('webshare.update', [{
            shares: updatedShares,
          }]);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('WebShare deleted'));
          this.loadWebShareConfig();
        },
        error: (error: unknown) => {
          this.dialog.error({
            title: this.translate.instant('Error deleting WebShare'),
            message: (error as Error).message,
          });
        },
      });
  }

  private setDataProvider(): void {
    const webshares$ = this.api.call('webshare.config').pipe(
      map((config: WebShareConfig) => {
        if (!config.shares) {
          return [];
        }
        // Show all shares including home base shares
        return config.shares.map((share) => ({
          name: share.name,
          path: share.path,
          search_indexed: share.search_indexed,
          is_home_base: share.is_home_base,
        }));
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider<WebShareTableRow>(webshares$);
    this.dataProvider.load();
  }

  private loadWebShareConfig(): void {
    this.dataProvider.load();
  }

  openTruenasConnectDialog(): void {
    this.matDialog.open(TruenasConnectStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: {
        top: '48px',
        right: '16px',
      },
    });
  }
}
