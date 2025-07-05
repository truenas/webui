import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, switchMap, map, take, combineLatest, of, catchError, shareReplay, Subject, startWith,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { webShareNameColumn } from 'app/pages/sharing/components/shares-dashboard/webshare-card/webshare-name-cell/webshare-name-cell.component';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

export interface WebShareTableRow {
  name: string;
  path: string;
  search_indexed?: boolean;
  is_home_base?: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-webshare-card',
  templateUrl: './webshare-card.component.html',
  styleUrls: ['./webshare-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    MatCard,
    MatToolbarRow,
    MatButton,
    RouterLink,
    IxIconComponent,
    RequiresRolesDirective,
    ServiceStateButtonComponent,
    ServiceExtraActionsComponent,
    TestDirective,
    TranslateModule,
    EmptyComponent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableEmptyDirective,
    IxTablePagerShowMoreComponent,
  ],
})
export class WebShareCardComponent implements OnInit {
  readonly requiredRoles = [Role.SharingWrite];

  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private snackbar = inject(SnackbarService);
  protected emptyService = inject(EmptyService);
  private store$ = inject(Store<AppState>);
  private window = inject(WINDOW);

  service$ = this.store$.select(selectService(ServiceName.WebShare));
  protected dataProvider: AsyncDataProvider<WebShareTableRow>;

  private refreshConfig$ = new Subject<void>();

  isServiceRunning$ = this.service$.pipe(
    map((service) => service?.state === ServiceStatus.Running),
  );

  webShareConfig$ = this.refreshConfig$.pipe(
    startWith(null),
    switchMap(() => this.api.call('webshare.config')),
    shareReplay({ bufferSize: 1, refCount: true }),
    catchError(() => of(null as WebShareConfig | null)),
  );

  // Check if current domain is *.truenas.direct
  isTruenasDirectDomain$ = of(this.window.location.hostname).pipe(
    map((hostname) => hostname.endsWith('.truenas.direct')),
  );

  // Show button only if service is running AND on *.truenas.direct domain
  showWebShareButton$ = combineLatest([
    this.isServiceRunning$,
    this.isTruenasDirectDomain$,
  ]).pipe(
    map(([isRunning, isTruenasDirect]) => isRunning && isTruenasDirect),
  );

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

  emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    title: '',
    message: this.translate.instant(
      'WebShare service provides web-based file access.<br><br>Users can access these shares if they have the WebShare Enabled option set on their account.',
    ),
    icon: iconMarker('ix-webshare'),
    large: true,
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
    uniqueRowTag: (row) => 'card-webshare-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('WebShare')],
  });


  ngOnInit(): void {
    const webshares$ = this.webShareConfig$.pipe(
      filter(Boolean),
      map((config) => {
        if (!config.shares) {
          return [];
        }
        // Show all shares including home base shares
        return config.shares.map((share) => ({
          name: share.name,
          path: share.path,
          search_indexed: share.search_indexed,
          is_home_base: share.is_home_base || false,
        }));
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider<WebShareTableRow>(webshares$);
    this.dataProvider.load();
  }

  onAddClicked(): void {
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
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.refreshConfig$.next();
        });
    });
  }

  openWebShare(): void {
    this.webShareConfig$.pipe(
      take(1),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((config) => {
      const protocol = this.window.location.protocol;
      const hostname = this.window.location.hostname;
      const port = config.proxy_port || 755;
      const webShareUrl = `${protocol}//${hostname}:${port}/webshare/`;
      this.window.open(webShareUrl, '_blank');
    });
  }

  protected doEdit(row: WebShareTableRow): void {
    this.webShareConfig$.pipe(take(1), untilDestroyed(this)).subscribe((config) => {
      const slideInRef$ = this.slideIn.open(WebShareSharesFormComponent, {
        data: {
          isNew: false,
          name: row.name,
          path: row.path,
          search_indexed: row.search_indexed,
          is_home_base: row.is_home_base,
          home_directory_template: config?.home_directory_template || '{{.Username}}',
        },
      });

      slideInRef$
        .pipe(filter((result) => result?.response), untilDestroyed(this))
        .subscribe(() => {
          this.refreshConfig$.next();
        });
    });
  }

  protected doDelete(row: WebShareTableRow): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete WebShare'),
      message: this.translate.instant(
        'Are you sure you want to delete the WebShare "{name}"? Users will no longer be able to access {path} through WebShare.',
        { name: row.name, path: row.path },
      ),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('webshare.config').pipe(
            switchMap((config) => {
              // Filter out the share to delete
              const updatedShares = config.shares.filter(
                (share) => share.name !== row.name,
              );
              return this.api.call('webshare.update', [{
                shares: updatedShares,
              }]);
            }),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('WebShare deleted'));
          this.refreshConfig$.next();
        },
        error: (error: unknown) => {
          this.dialog.error({
            title: this.translate.instant('Error deleting WebShare'),
            message: (error as Error).message,
          });
        },
      });
  }
}
