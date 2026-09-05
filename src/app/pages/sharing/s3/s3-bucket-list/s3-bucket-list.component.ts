import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import { filter, switchMap, tap } from 'rxjs';
import { s3CardEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { s3PermissionsModelLabels, s3VersioningLabels } from 'app/enums/s3.enum';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { s3BucketListElements } from 'app/pages/sharing/s3/s3-bucket-list/s3-bucket-list.elements';
import { bucketToShareRow } from 'app/pages/sharing/s3/utils/s3-bucket.utils';
import { getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';

@Component({
  selector: 'ix-s3-bucket-list',
  templateUrl: './s3-bucket-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    BasicSearchComponent,
    MatAnchor,
    TestDirective,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    UiSearchDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    EmptyComponent,
  ],
})
export class S3BucketListComponent implements OnInit {
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private slideIn = inject(SlideIn);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private poolStoreService = inject(poolStore);

  requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly searchableElements = s3BucketListElements;
  protected readonly emptyConfig = s3CardEmptyConfig;
  protected readonly EmptyType = EmptyType;

  searchQuery = signal('');
  dataProvider: AsyncDataProvider<S3Bucket>;

  buckets: S3Bucket[] = [];
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);

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
    textColumn({
      title: this.translate.instant('Permissions Model'),
      propertyName: 'permissions_model',
      getValue: (row) => this.translate.instant(
        s3PermissionsModelLabels.get(row.permissions_model) || row.permissions_model,
      ),
    }),
    textColumn({
      title: this.translate.instant('Versioning'),
      propertyName: 'versioning',
      hidden: true,
      getValue: (row) => this.translate.instant(s3VersioningLabels.get(row.versioning) || row.versioning),
    }),
    yesNoColumn({
      title: this.translate.instant('Object Lock'),
      propertyName: 'object_lock',
      hidden: true,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: S3Bucket) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
      isDisabled: (row: S3Bucket) => isShareUnavailable(bucketToShareRow(row), this.activePoolPaths()),
      getDisabledTooltip: (row: S3Bucket) => this.translate.instant(
        getUnavailableReason(bucketToShareRow(row), this.activePoolPaths()),
      ),
    }),
    actionsWithMenuColumn({
      actions: [
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
      ],
    }),
  ], {
    uniqueRowTag: (row) => 's3-bucket-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('S3 Bucket')],
  });

  ngOnInit(): void {
    const buckets$ = this.api.call('sharing.s3.query').pipe(
      tap((buckets) => this.buckets = buckets),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<S3Bucket>(buckets$);
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });

    this.poolStoreService.call.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pools) => {
        this.activePoolPaths.set(pools.map((pool) => pool.path));
        this.refresh();
      },
      error: () => {
        this.refresh();
      },
    });
  }

  protected doAdd(): void {
    this.slideIn.open(S3BucketFormComponent).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.refresh());
  }

  protected doEdit(bucket: S3Bucket): void {
    this.slideIn.open(S3BucketFormComponent, { data: bucket }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.refresh());
  }

  protected doDelete(bucket: S3Bucket): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete S3 bucket "{name}"?', { name: bucket.name }),
      message: this.translate.instant(helptextSharingS3.deleteBucketMessage),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('sharing.s3.delete', [bucket.id]).pipe(this.loader.withLoader())),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.refresh(),
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: ['name', 'dataset', 'owner'],
    });
    this.cdr.markForCheck();
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  private refresh(): void {
    this.dataProvider.load();
  }

  private onChangeEnabledState(row: S3Bucket): void {
    this.api.call('sharing.s3.update', [row.id, { enabled: !row.enabled }]).pipe(
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
}
