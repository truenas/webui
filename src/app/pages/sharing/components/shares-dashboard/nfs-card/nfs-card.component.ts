import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed,
  inject, DestroyRef, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderActionsDirective,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnSlideToggleComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { BehaviorSubject } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { LoadingMap, accumulateLoadingState } from 'app/helpers/operators/accumulate-loading-state.helper';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import {
  ShareActionsCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-actions-cell/share-actions-cell.component';
import {
  ShareToggleCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-toggle-cell/share-toggle-cell.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-nfs-card',
  templateUrl: './nfs-card.component.html',
  styleUrls: ['./nfs-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    TnCardFooterActionsDirective,
    TnSlideToggleComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    RequiresRolesDirective,
    TestDirective,
    TnIconComponent,
    TnTooltipDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    ServiceNfsComponent,
    ShareToggleCellComponent,
    ShareActionsCellComponent,
    TierStatusComponent,
  ],
})
export class NfsCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private store$ = inject<Store<ServicesState>>(Store);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private poolStoreService = inject(poolStore);
  private authService = inject(AuthService);
  protected actionsMenu = inject(ServiceActionsMenuService);
  private tierService = inject(SharingTierService);
  private snackbar = inject(SnackbarService);

  loadingMap$ = new BehaviorSubject<LoadingMap>(new Map());
  requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  service$ = this.store$.select(selectService(ServiceName.Nfs));
  protected service = toSignal(this.service$);
  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected serviceStatus = computed(() => this.actionsMenu.buildCardHeaderStatus(this.service()));

  protected headerMenuTriggerTestId = computed(() => this.actionsMenu.cardHeaderMenuTriggerTestId(this.service()));

  protected configOpen = signal(false);
  protected configForm = viewChild(ServiceNfsComponent);
  protected closeConfigGuard = this.actionsMenu.buildUnsavedChangesGuard(
    () => this.configForm()?.hasUnsavedChanges() ?? false,
  );

  protected serviceMenu = computed(() => this.actionsMenu.buildServiceCardMenu(
    this.service(),
    this.hasAddRole(),
    () => this.configOpen.set(true),
  ));

  protected onConfigClosed(): void {
    this.configOpen.set(false);
  }

  dataProvider: AsyncDataProvider<NfsShare>;
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);
  protected readonly cardMenuPath = ['sharing', 'nfs'];

  private tierAction: IconActionConfig<NfsShare> = this.tierService.createChangeTierAction<NfsShare>({
    destroyRef: this.destroyRef,
    reload: () => this.dataProvider.load(),
    requiredRoles: this.requiredRoles,
  });

  protected readonly actions: IconActionConfig<NfsShare>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    this.tierAction,
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  /**
   * Column order matches the legacy ix-table columns. The `tier` column is only
   * displayed when tiering is enabled — replacing the old `hidden`/`setColumns`
   * mutation with reactive membership driven by `tierService.tierEnabled()`.
   */
  protected readonly displayedColumns = computed<string[]>(() => {
    const columns = ['path', 'comment', 'enabled'];
    if (this.tierService.tierEnabled()) {
      columns.push('tier');
    }
    columns.push('actions');
    return columns;
  });

  protected readonly trackByNfsId = (_index: number, row: NfsShare): number => row.id;

  protected uniqueRowTag(row: NfsShare): string {
    return convertStringToId('card-nfs-share-' + row.path + '-' + row.comment);
  }

  protected ariaLabel(row: NfsShare): string {
    return [row.path, this.translate.instant('NFS Share')].join(' ');
  }

  protected isToggleDisabled(row: NfsShare): boolean {
    return isShareUnavailable(row, this.activePoolPaths());
  }

  protected getEnabledTooltip(row: NfsShare): string {
    return this.isToggleDisabled(row)
      ? this.translate.instant(getUnavailableReason(row, this.activePoolPaths()))
      : '';
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<NfsShare>(event, this.displayedColumns()));
  }

  ngOnInit(): void {
    const nfsShares$ = this.api.call('sharing.nfs.query').pipe(takeUntilDestroyed(this.destroyRef));
    this.dataProvider = new AsyncDataProvider<NfsShare>(nfsShares$);
    this.setDefaultSort();

    this.poolStoreService.call.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pools) => {
        this.activePoolPaths.set(pools.map((pool) => pool.path));
        this.dataProvider.load();
      },
      error: () => {
        this.dataProvider.load();
      },
    });

    // Prime the tier config so `displayedColumns` reactively reveals the tier
    // column when tiering is enabled, and reload the list on tier-job ticks.
    this.tierService.getTierConfig().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.tierService.wireTierJobRefresh({
      destroyRef: this.destroyRef,
      reload: () => this.dataProvider.load(),
    });
  }

  protected openForm(row?: NfsShare): void {
    this.slideIn.open(NfsFormComponent, { data: { existingNfsShare: row } })
      .onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  protected doDelete(nfs: NfsShare): void {
    this.dialogService.confirmDelete({
      message: this.translate.instant('Are you sure you want to delete NFS Share <b>"{path}"</b>?', { path: nfs.path }),
      call: () => this.api.call('sharing.nfs.delete', [nfs.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected onChangeEnabledState(row: NfsShare): void {
    const enabled = !row.enabled;

    this.api.call('sharing.nfs.update', [row.id, { enabled }]).pipe(
      accumulateLoadingState(row.id, this.loadingMap$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
        this.snackbar.success(
          enabled
            ? this.translate.instant('NFS share «{path}» enabled', { path: row.path })
            : this.translate.instant('NFS share «{path}» disabled', { path: row.path }),
        );
      },
      error: (error: unknown) => {
        this.dataProvider.load();
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'path',
    });
  }
}
