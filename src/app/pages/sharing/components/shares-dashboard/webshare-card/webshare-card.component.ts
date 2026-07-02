import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, OnInit, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnBannerComponent,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderActionsDirective,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnSlideToggleComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
  type TnCardAction,
  type TnSortEvent,
} from '@truenas/ui-components';
import {
  filter, switchMap, map, of, catchError, shareReplay, Subject, startWith,
} from 'rxjs';
import { combineLatestWith } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceWebshareComponent } from 'app/pages/services/components/service-webshare/service-webshare.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { WebShareTableRow } from 'app/pages/sharing/components/webshare-name-cell/webshare-name-cell.component';
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
    TnBannerComponent,
    TnButtonComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    TnCardFooterActionsDirective,
    TnSlideToggleComponent,
    RequiresRolesDirective,
    TnTooltipDirective,
    RouterLink,
    TnIconComponent,
    TestDirective,
    TranslateModule,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    CardAlertBadgeComponent,
    TableActionsCellComponent,
  ],
})
export class WebShareCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWebshareWrite, Role.SharingWrite];
  protected readonly cardMenuPath = ['sharing', 'webshare'];

  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private formPanel = inject(FormSidePanelService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  protected emptyService = inject(EmptyService);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  private webShareService = inject(WebShareService);
  private truenasConnectService = inject(TruenasConnectService);
  private authService = inject(AuthService);
  protected actionsMenu = inject(ServiceActionsMenuService);

  service$ = this.store$.select(selectService(ServiceName.WebShare));
  protected service = toSignal(this.service$);
  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });
  protected dataProvider: AsyncDataProvider<WebShareTableRow>;

  private refreshConfig$ = new Subject<void>();

  isServiceRunning$ = this.service$.pipe(
    map((service) => service?.state === ServiceStatus.Running),
  );

  webShares$ = this.refreshConfig$.pipe(
    startWith(null),
    switchMap(() => this.api.call('sharing.webshare.query', [[]]).pipe(
      catchError(() => of([] as WebShare[])),
    )),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly canOpenWebShare = this.webShareService.canOpenWebShare;

  hasTruenasConnect$ = this.truenasConnectService.config$.pipe(
    map((config) => config?.status === TruenasConnectStatus.Configured),
  );

  protected hasTruenasConnect = toSignal(this.hasTruenasConnect$, { initialValue: false });

  showNoWebshareUsersNotice$ = this.hasTruenasConnect$.pipe(
    combineLatestWith(this.webShareService.hasWebshareUsers$),
    map(([hasTruenasConnect, hasWebshareUsers]) => hasTruenasConnect && !hasWebshareUsers),
  );

  protected readonly helptext = helptextSharingWebshare;

  protected serviceStatus = computed(() => this.actionsMenu.buildCardHeaderStatus(this.service()));

  protected headerMenuTriggerTestId = computed(() => this.actionsMenu.cardHeaderMenuTriggerTestId(this.service()));

  protected openAction = computed<TnCardAction | undefined>(() => {
    return {
      label: this.translate.instant('Open WebShare'),
      disabled: !this.canOpenWebShare(),
      testId: 'button-webshare-open',
      handler: () => this.openWebShare(),
    };
  });

  protected serviceMenu = computed(() => this.actionsMenu.buildServiceCardMenu(
    this.service(),
    this.hasAddRole(),
    () => this.openConfig(),
  ));

  protected openConfig(): void {
    this.formPanel.open(ServiceWebshareComponent, { title: serviceNames.get(ServiceName.WebShare) });
  }

  protected readonly actions: IconActionConfig<WebShareTableRow>[] = [
    {
      iconName: tnIconMarker('open-in-new', 'mdi'),
      tooltip: this.translate.instant('Open'),
      onClick: (row) => this.openWebShareByName(row),
      disabled: () => this.webShareService.canOpenWebShare$.pipe(map((canOpen) => !canOpen)),
      dynamicTooltip: () => this.webShareService.webShareUnavailableReason$.pipe(
        map((reason) => reason ?? this.translate.instant('Open')),
      ),
    },
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected readonly displayedColumns = ['name', 'path', 'actions'];

  protected readonly trackByWebShareId = (_index: number, row: WebShareTableRow): number => row.id;

  protected uniqueRowTag(row: WebShareTableRow): string {
    return convertStringToId('card-webshare-' + row.name);
  }

  protected ariaLabel(row: WebShareTableRow): string {
    return [row.name, this.translate.instant('WebShare')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<WebShareTableRow>(event, this.displayedColumns));
  }

  ngOnInit(): void {
    const webshares$ = this.webShares$.pipe(
      map((shares) => this.webShareService.transformToTableRows(shares)),
      takeUntilDestroyed(this.destroyRef),
    );

    this.dataProvider = new AsyncDataProvider<WebShareTableRow>(webshares$);
    this.dataProvider.load();

    // Trigger hostname lookup to enable WebShare opening when not on truenas.direct domain
    this.webShareService.hostnameMapping$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      error: () => {
        // Error already handled by catchError in hostnameMapping$
      },
    });
  }

  onAddClicked(): void {
    this.webShareService.openWebShareForm({
      isNew: true,
      name: '',
      path: '',
    }).pipe(
      filter((success) => success),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.refreshConfig$.next();
    });
  }

  openWebShare(): void {
    this.webShareService.openWebShare();
  }

  openTruenasConnectDialog(): void {
    this.truenasConnectService.openStatusModal();
  }

  navigateToUsers(): void {
    this.router.navigate(['/credentials', 'users']);
  }

  openWebShareByName(row: WebShareTableRow): void {
    this.webShareService.openWebShare(row.name);
  }

  protected doEdit(row: WebShareTableRow): void {
    this.slideIn.open(WebShareSharesFormComponent, {
      data: {
        id: row.id,
        isNew: false,
        name: row.name,
        path: row.path,
        isHomeBase: row.isHomeBase,
      },
    }).onSuccess(() => this.refreshConfig$.next(), this.destroyRef);
  }

  protected doDelete(row: WebShareTableRow): void {
    this.dialog.confirmDelete({
      title: this.translate.instant(this.helptext.delete_dialog_title),
      message: this.translate.instant(this.helptext.delete_dialog_message, {
        name: row.name,
        path: row.path,
      }),
      call: () => this.api.call('sharing.webshare.delete', [row.id]),
      successMessage: this.translate.instant('WebShare deleted'),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.refreshConfig$.next());
  }
}
