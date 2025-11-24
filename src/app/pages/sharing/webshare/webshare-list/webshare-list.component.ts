import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, switchMap, map, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
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
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { webShareNameColumn, WebShareTableRow } from 'app/pages/sharing/components/webshare-name-cell/webshare-name-cell.component';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { WebShareService } from 'app/pages/sharing/webshare/webshare.service';
import { LicenseService } from 'app/services/license.service';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';

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
    SearchInputComponent,
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

  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  protected emptyService = inject(EmptyService);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  private licenseService = inject(LicenseService);
  private webShareService = inject(WebShareService);
  private truenasConnectService = inject(TruenasConnectService);
  private window = inject(WINDOW);

  service$ = this.store$.select(selectService(ServiceName.WebShare));
  filterString = '';
  searchQuery: SearchQuery<WebShareTableRow> = { isBasicQuery: true, query: '' };
  dataProvider: AsyncDataProvider<WebShareTableRow>;

  hasTruenasConnect$ = this.licenseService.hasTruenasConnect$;

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
    webShareNameColumn({
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
          iconName: iconMarker('mdi-open-in-new'),
          tooltip: this.translate.instant('Open'),
          onClick: (row) => this.openWebShare(row),
          disabled: () => of(!this.isTruenasDirectDomain()),
          dynamicTooltip: () => of(
            this.isTruenasDirectDomain()
              ? this.translate.instant('Open')
              : this.translate.instant('WebShare can only be opened when accessed via a .truenas.direct domain'),
          ),
        },
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

  ngOnInit(): void {
    this.setDataProvider();
    this.setDefaultSort();
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
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

  onSearch(query: SearchQuery<WebShareTableRow>): void {
    const searchString = query.isBasicQuery ? query.query : '';
    this.onListFiltered(searchString);
  }

  doAdd(): void {
    this.webShareService.openWebShareForm({
      isNew: true,
      name: '',
      path: '',
    }).pipe(
      filter((success) => success),
      takeUntilDestroyed(this.destroyRef),
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    ).subscribe(() => {
      this.loadWebShareConfig();
    });
  }

  doEdit(row: WebShareTableRow): void {
    const slideInRef$ = this.slideIn.open(WebShareSharesFormComponent, {
      data: {
        id: row.id,
        isNew: false,
        name: row.name,
        path: row.path,
      },
    });

    slideInRef$
      .pipe(filter((result) => result?.response), takeUntilDestroyed(this.destroyRef))
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
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
        switchMap(() => this.api.call('sharing.webshare.delete', [row.id])),
        takeUntilDestroyed(this.destroyRef),
      )
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
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
    const webshares$ = this.api.call('sharing.webshare.query', [[]]).pipe(
      map((shares: WebShare[]) => shares.map((share) => ({
        id: share.id,
        name: share.name,
        path: share.path,
      }))),
      takeUntilDestroyed(this.destroyRef),
    );

    this.dataProvider = new AsyncDataProvider<WebShareTableRow>(webshares$);
    this.dataProvider.load();
  }

  private loadWebShareConfig(): void {
    this.dataProvider.load();
  }

  openTruenasConnectDialog(): void {
    this.truenasConnectService.openStatusModal();
  }

  private isTruenasDirectDomain(): boolean {
    return this.window.location.hostname.includes('.truenas.direct');
  }

  openWebShare(row: WebShareTableRow): void {
    this.webShareService.openWebShare(row.name);
  }
}
