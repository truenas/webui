import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { tnIconMarker, TnIconComponent } from '@truenas/ui-components';
import { BehaviorSubject, filter, switchMap } from 'rxjs';
import { s3CardEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { LoadingMap, accumulateLoadingState } from 'app/helpers/operators/accumulate-loading-state.helper';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
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
    MatCard,
    MatToolbarRow,
    TestDirective,
    TnIconComponent,
    ServiceStateButtonComponent,
    RequiresRolesDirective,
    MatButton,
    MatTooltip,
    ServiceExtraActionsComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    EmptyComponent,
    CardAlertBadgeComponent,
  ],
})
export class S3CardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private store$ = inject<Store<ServicesState>>(Store);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private poolStoreService = inject(poolStore);

  loadingMap$ = new BehaviorSubject<LoadingMap>(new Map());
  requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  service$ = this.store$.select(selectService(ServiceName.S3));
  dataProvider: AsyncDataProvider<S3Bucket>;
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);
  protected readonly emptyConfig = s3CardEmptyConfig;
  protected readonly cardMenuPath = ['sharing', 's3'];

  columns = createTable<S3Bucket>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Dataset'),
      propertyName: 'dataset',
    }),
    textColumn({
      title: this.translate.instant('Owner'),
      propertyName: 'owner',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      cssClass: 'tight-toggle',
      onRowToggle: (row: S3Bucket) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
      isDisabled: (row: S3Bucket) => isShareUnavailable(bucketToShareRow(row), this.activePoolPaths()),
      getDisabledTooltip: (row: S3Bucket) => this.translate.instant(
        getUnavailableReason(bucketToShareRow(row), this.activePoolPaths()),
      ),
    }),
    actionsWithMenuColumn({
      cssClass: 'tight-actions',
      actions: [
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
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-s3-bucket-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('S3 Bucket')],
  });

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
    this.slideIn.open(S3BucketFormComponent, { data: row }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected doDelete(bucket: S3Bucket): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete S3 bucket "{name}"?', { name: bucket.name }),
      message: this.translate.instant(helptextSharingS3.deleteBucketMessage),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('sharing.s3.delete', [bucket.id])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private onChangeEnabledState(row: S3Bucket): void {
    this.api.call('sharing.s3.update', [row.id, { enabled: !row.enabled }]).pipe(
      accumulateLoadingState(row.id, this.loadingMap$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.dataProvider.load();
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }
}
