import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, OnInit, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, switchMap, map, of, catchError, shareReplay, Subject, startWith,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { WebShare } from 'app/interfaces/webshare-config.interface';
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
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { webShareNameColumn, WebShareTableRow } from 'app/pages/sharing/components/webshare-name-cell/webshare-name-cell.component';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { WebShareService } from 'app/pages/sharing/webshare/webshare.service';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';

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
    MatTooltip,
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
  private destroyRef = inject(DestroyRef);
  private webShareService = inject(WebShareService);
  private truenasConnectService = inject(TruenasConnectService);
  private loader = inject(LoaderService);

  service$ = this.store$.select(selectService(ServiceName.WebShare));
  protected dataProvider: AsyncDataProvider<WebShareTableRow>;

  private refreshConfig$ = new Subject<void>();

  isServiceRunning$ = this.service$.pipe(
    map((service) => service?.state === ServiceStatus.Running),
  );

  webShares$ = this.refreshConfig$.pipe(
    startWith(null),
    switchMap(() => this.api.call('sharing.webshare.query', [[]])),
    shareReplay({ bufferSize: 1, refCount: true }),
    catchError(() => of([] as WebShare[])),
  );

  // Check if current domain is *.truenas.direct (static check, hostname doesn't change at runtime)
  // WebShare service is only accessible on *.truenas.direct domains for security reasons
  readonly isTruenasDirectDomain = this.webShareService.isTruenasDirectDomain;

  hasTruenasConnect$ = this.truenasConnectService.config$.pipe(
    map((config) => config?.status === TruenasConnectStatus.Configured),
  );

  protected readonly helptext = helptextSharingWebshare;

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
          iconName: iconMarker('mdi-open-in-new'),
          tooltip: this.translate.instant('Open'),
          onClick: (row) => this.openWebShareByName(row),
          disabled: () => of(!this.isTruenasDirectDomain),
          dynamicTooltip: () => of(
            this.isTruenasDirectDomain
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
    uniqueRowTag: (row) => 'card-webshare-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('WebShare')],
  });


  ngOnInit(): void {
    const webshares$ = this.webShares$.pipe(
      map((shares) => this.webShareService.transformToTableRows(shares)),
      takeUntilDestroyed(this.destroyRef),
    );

    this.dataProvider = new AsyncDataProvider<WebShareTableRow>(webshares$);
    this.dataProvider.load();
  }

  onAddClicked(): void {
    this.webShareService.openWebShareForm({
      isNew: true,
      name: '',
      path: '',
    }).pipe(
      filter((success) => success),
      takeUntilDestroyed(this.destroyRef),
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    ).subscribe(() => {
      this.refreshConfig$.next();
    });
  }

  openWebShare(): void {
    this.webShareService.openWebShare();
  }

  openWebShareByName(row: WebShareTableRow): void {
    this.webShareService.openWebShare(row.name);
  }

  protected doEdit(row: WebShareTableRow): void {
    const slideInRef$ = this.slideIn.open(WebShareSharesFormComponent, {
      data: {
        id: row.id,
        isNew: false,
        name: row.name,
        path: row.path,
      },
    });

    slideInRef$
      .pipe(filter((result) => !!result?.response), takeUntilDestroyed(this.destroyRef))
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
      .subscribe(() => {
        this.refreshConfig$.next();
      });
  }

  protected doDelete(row: WebShareTableRow): void {
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
        switchMap(() => {
          return this.api.call('sharing.webshare.delete', [row.id]).pipe(
            this.loader.withLoader(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
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
