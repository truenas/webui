import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed,
  inject, DestroyRef, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
  type TnCardAction,
  type TnSortEvent,
} from '@truenas/ui-components';
import {
  map, BehaviorSubject, of,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { LoadingMap, accumulateLoadingState } from 'app/helpers/operators/accumulate-loading-state.helper';
import {
  ExternalSmbShareOptions, LegacySmbShareOptions, SmbShare, SmbSharesec,
} from 'app/interfaces/smb-share.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableToggleCellComponent,
} from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { getFilesystemAclUnavailableReason, getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { isRootShare } from 'app/pages/sharing/utils/smb.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-smb-card',
  templateUrl: './smb-card.component.html',
  styleUrls: ['./smb-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
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
    YesNoPipe,
    RouterLink,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    ServiceSmbComponent,
    TableToggleCellComponent,
    TableActionsCellComponent,
    TierStatusComponent,
  ],
})
export class SmbCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  protected emptyService = inject(EmptyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<ServicesState>>(Store);
  private poolStoreService = inject(poolStore);
  private authService = inject(AuthService);
  private actionsMenu = inject(ServiceActionsMenuService);
  private tierService = inject(SharingTierService);
  private snackbar = inject(SnackbarService);

  requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  loadingMap$ = new BehaviorSubject<LoadingMap>(new Map());
  protected readonly cardMenuPath = ['sharing', 'smb'];

  service$ = this.store$.select(selectService(ServiceName.Cifs));
  private service = toSignal(this.service$);
  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected serviceStatus = computed(() => this.actionsMenu.buildCardHeaderStatus(this.service()));

  protected headerMenuTriggerTestId = computed(() => this.actionsMenu.cardHeaderMenuTriggerTestId(this.service()));

  protected addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'button-smb-share-add',
      handler: () => this.openForm(),
    };
  });

  protected configOpen = signal(false);
  protected configForm = viewChild(ServiceSmbComponent);
  protected closeConfigGuard = this.actionsMenu.buildUnsavedChangesGuard(
    () => this.configForm()?.hasUnsavedChanges() ?? false,
  );

  protected serviceMenu = computed(() => this.actionsMenu.buildServiceCardMenu(
    this.service(),
    this.hasAddRole(),
    () => this.configOpen.set(true),
  ));

  protected serviceControl = computed(() => this.actionsMenu.buildServiceControl(this.service(), this.hasAddRole()));

  protected onConfigClosed(): void {
    this.configOpen.set(false);
  }

  dataProvider: AsyncDataProvider<SmbShare>;
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);

  private tierAction: IconActionConfig<SmbShare> = this.tierService.createChangeTierAction<SmbShare>({
    destroyRef: this.destroyRef,
    reload: () => this.dataProvider.load(),
    requiredRoles: this.requiredRoles,
  });

  protected readonly actions: IconActionConfig<SmbShare>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      disabled: (row) => this.loadingMap$.pipe(map((ids) => Boolean(ids.get(row.id)))),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('share-variant', 'mdi'),
      tooltip: this.translate.instant('Edit Share ACL'),
      disabled: (row) => of(isShareUnavailable(row, this.activePoolPaths())),
      disabledTooltip: (row: SmbShare) => this.translate.instant(getUnavailableReason(row, this.activePoolPaths())),
      onClick: (row) => this.doShareAclEdit(row),
    },
    {
      iconName: tnIconMarker('security', 'mdi'),
      tooltip: this.translate.instant('Edit Filesystem ACL'),
      disabled: (row) => of(isRootShare(row.path) || isShareUnavailable(row, this.activePoolPaths())),
      disabledTooltip: (row: SmbShare) => this.translate.instant(
        getFilesystemAclUnavailableReason(row, this.activePoolPaths()),
      ),
      onClick: (row) => this.doFilesystemAclEdit(row),
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
    const columns = ['name', 'path', 'comment', 'enabled', 'audit'];
    if (this.tierService.tierEnabled()) {
      columns.push('tier');
    }
    columns.push('actions');
    return columns;
  });

  protected readonly trackBySmbId = (_index: number, row: SmbShare): number => row.id;

  protected uniqueRowTag(row: SmbShare): string {
    return convertStringToId('card-smb-share-' + row.name);
  }

  protected ariaLabel(row: SmbShare): string {
    return [row.name, this.translate.instant('SMB Share')].join(' ');
  }

  protected getPathValue(row: SmbShare): string {
    return (row.options as ExternalSmbShareOptions)?.remote_path?.join(', ') || row.path;
  }

  protected isToggleDisabled(row: SmbShare): boolean {
    return isShareUnavailable(row, this.activePoolPaths());
  }

  protected getEnabledTooltip(row: SmbShare): string {
    return this.isToggleDisabled(row)
      ? this.translate.instant(getUnavailableReason(row, this.activePoolPaths()))
      : '';
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<SmbShare>(event, this.displayedColumns()));
  }

  ngOnInit(): void {
    const smbShares$ = this.api.call('sharing.smb.query').pipe(takeUntilDestroyed(this.destroyRef));
    this.dataProvider = new AsyncDataProvider<SmbShare>(smbShares$);
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

  protected openForm(row?: SmbShare): void {
    this.slideIn.open(SmbFormComponent, { data: { existingSmbShare: row } })
      .onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  protected doDelete(smb: SmbShare): void {
    this.dialogService.confirmDelete({
      message: this.translate.instant('Are you sure you want to delete SMB Share <b>"{name}"</b>?', { name: smb.name }),
      call: () => this.api.call('sharing.smb.delete', [smb.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }

  private doShareAclEdit(row: SmbShare): void {
    // A home share has a name (homes) set; row.name works for other shares
    const searchName = (row.options as LegacySmbShareOptions)?.home ? 'homes' : row.name;
    this.api.call('sharing.smb.getacl', [{ share_name: searchName }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (shareAcl: SmbSharesec) => {
          this.slideIn.open(SmbAclComponent, { data: shareAcl.share_name })
            .onSuccess(() => this.dataProvider.load(), this.destroyRef);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private doFilesystemAclEdit(row: SmbShare): void {
    if (row.locked) {
      this.showLockedPathDialog(row.path);
    } else {
      this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
        queryParams: {
          path: row.path,
          returnUrl: this.router.url,
        },
      });
    }
  }

  private showLockedPathDialog(path: string): void {
    this.dialogService.error({
      title: this.translate.instant('Error'),
      message: this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    });
  }

  protected onChangeEnabledState(row: SmbShare): void {
    const enabled = !row.enabled;

    this.api.call('sharing.smb.update', [row.id, { enabled }]).pipe(
      accumulateLoadingState(row.id, this.loadingMap$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
        this.snackbar.success(
          enabled
            ? this.translate.instant('SMB share «{name}» enabled', { name: row.name })
            : this.translate.instant('SMB share «{name}» disabled', { name: row.name }),
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
      propertyName: 'name',
    });
  }
}
