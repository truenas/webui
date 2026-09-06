import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  TnSlideToggleComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { BehaviorSubject } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { LoadingMap, accumulateLoadingState } from 'app/helpers/operators/accumulate-loading-state.helper';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { TablePagerShowMoreComponent } from 'app/modules/tn-table/components/table-pager-show-more/table-pager-show-more.component';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/tn-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { bucketToShareRow } from 'app/pages/sharing/s3/utils/s3-bucket.utils';
import { getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-s3-card',
  templateUrl: './s3-card.component.html',
  styleUrls: ['./s3-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    TnCardFooterActionsDirective,
    TnSlideToggleComponent,
    RequiresRolesDirective,
    TnTestIdDirective,
    TnIconComponent,
    TnTooltipDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    TableToggleCellComponent,
    TableActionsCellComponent,
  ],
})
export class S3CardComponent implements OnInit {
  private formPanel = inject(FormSidePanelService);
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
  private snackbar = inject(SnackbarService);

  loadingMap$ = new BehaviorSubject<LoadingMap>(new Map());
  requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  service$ = this.store$.select(selectService(ServiceName.S3));
  protected service = toSignal(this.service$);
  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected serviceStatus = computed(() => this.actionsMenu.buildCardHeaderStatus(this.service()));

  protected headerMenuTriggerTestId = computed(() => this.actionsMenu.cardHeaderMenuTriggerTestId(this.service()));

  protected serviceMenu = computed(() => this.actionsMenu.buildServiceCardMenu(
    this.service(),
    this.hasAddRole(),
    () => this.openConfig(),
  ));

  dataProvider: AsyncDataProvider<S3Bucket>;
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);
  protected readonly cardMenuPath = ['sharing', 's3'];

  protected readonly actions: IconActionConfig<S3Bucket>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected readonly displayedColumns = ['name', 'dataset', 'owner', 'enabled', 'actions'];

  protected readonly trackByBucketId = (_index: number, row: S3Bucket): number => row.id;

  protected uniqueRowTag(row: S3Bucket): string {
    return convertStringToId('card-s3-bucket-' + row.name);
  }

  protected ariaLabel(row: S3Bucket): string {
    return [row.name, this.translate.instant('S3 Bucket')].join(' ');
  }

  protected isToggleDisabled(row: S3Bucket): boolean {
    return isShareUnavailable(bucketToShareRow(row), this.activePoolPaths());
  }

  protected getEnabledTooltip(row: S3Bucket): string {
    return this.isToggleDisabled(row)
      ? this.translate.instant(getUnavailableReason(bucketToShareRow(row), this.activePoolPaths()))
      : '';
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<S3Bucket>(event, this.displayedColumns));
  }

  ngOnInit(): void {
    const buckets$ = this.api.call('sharing.s3.query').pipe(takeUntilDestroyed(this.destroyRef));
    this.dataProvider = new AsyncDataProvider<S3Bucket>(buckets$);
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
  }

  protected openForm(row?: S3Bucket): void {
    this.formPanel.open(S3BucketFormComponent, {
      title: row
        ? this.translate.instant('Edit S3 Bucket')
        : this.translate.instant('Add S3 Bucket'),
      inputs: { bucket: row },
    }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  protected openConfig(): void {
    this.formPanel.open(ServiceS3Component, { title: serviceNames.get(ServiceName.S3) });
  }

  protected doDelete(bucket: S3Bucket): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Delete S3 bucket "{name}"?', { name: bucket.name }),
      message: this.translate.instant(helptextSharingS3.deleteBucketMessage),
      call: () => this.api.call('sharing.s3.delete', [bucket.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected onChangeEnabledState(row: S3Bucket, toggle: TableToggleCellComponent): void {
    const enabled = !row.enabled;

    this.api.call('sharing.s3.update', [row.id, { enabled }]).pipe(
      accumulateLoadingState(row.id, this.loadingMap$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
        this.snackbar.success(
          enabled
            ? this.translate.instant('S3 bucket «{name}» enabled', { name: row.name })
            : this.translate.instant('S3 bucket «{name}» disabled', { name: row.name }),
        );
      },
      error: (error: unknown) => {
        toggle.revert();
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
