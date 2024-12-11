import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, of } from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { helpTextQuotas } from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  DatasetQuotaAddFormComponent,
} from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import {
  DatasetQuotaEditFormComponent,
} from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

interface QuotaData {
  quotaType: DatasetQuotaType.User | DatasetQuotaType.Group;
  quotaObjType: DatasetQuotaType.UserObj | DatasetQuotaType.GroupObj;
  helpTextKey: 'users' | 'groups';
}

@UntilDestroy()
@Component({
  selector: 'ix-dataset-quotas-list',
  templateUrl: './dataset-quotas-list.component.html',
  styleUrls: ['./dataset-quotas-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    MatSlideToggle,
    TestDirective,
    RequiresRolesDirective,
    MatButton,
    TranslateModule,
    IxTableComponent,
    AsyncPipe,
    IxTableHeadComponent,
    IxTableEmptyDirective,
    IxTableBodyComponent,
    IxTablePagerComponent,
  ],
})
export class DatasetQuotasListComponent implements OnInit {
  protected readonly requiredRoles = [Role.DatasetWrite];
  readonly emptyValue = '—';
  readonly helpText = helpTextQuotas;

  dataProvider = new ArrayDataProvider<DatasetQuota>();
  columns = createTable<DatasetQuota>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      getValue: (row) => {
        if (row.name) {
          return row.name;
        }
        return this.emptyValue;
      },
    }),
    textColumn({
      title: this.translate.instant('ID'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Data Quota'),
      propertyName: 'quota',
      getValue: (row) => {
        if (row.quota >= 0) {
          return this.formatter.convertBytesToHumanReadable(row.quota, 0);
        }
        return this.emptyValue;
      },
    }),
    textColumn({
      title: this.translate.instant('DQ Used'),
      propertyName: 'used_bytes',
      getValue: (row) => {
        if (row.used_bytes >= 0) {
          return this.formatter.convertBytesToHumanReadable(row.used_bytes, 2);
        }
        return this.emptyValue;
      },
    }),
    textColumn({
      title: this.translate.instant('DQ % Used'),
      propertyName: 'used_percent',
      getValue: (row) => {
        if (row.used_percent >= 0) {
          return `${Math.round(row.used_percent * 100) / 100}%`;
        }
        return this.emptyValue;
      },
    }),
    textColumn({
      title: this.translate.instant('Object Quota'),
      propertyName: 'obj_quota',
      getValue: (row) => row.obj_quota || this.emptyValue,
    }),
    textColumn({
      title: this.translate.instant('OQ Used'),
      propertyName: 'obj_used',
      getValue: (row) => row.obj_used || this.emptyValue,
    }),
    textColumn({
      title: this.translate.instant('OQ % Used'),
      propertyName: 'obj_used',
      getValue: (row: DatasetQuota) => {
        if (row.obj_used && row.obj_quota) {
          return `${Math.round(row.obj_used / row.obj_quota * 100) / 100}%`;
        }
        return this.emptyValue;
      },
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row: DatasetQuota) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row: DatasetQuota) => this.doDelete(row),
          hidden: (row: DatasetQuota) => of(!(row.quota > 0 || row.obj_quota > 0)),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row: DatasetQuota) => `${this.helpTextKey}-quota-${row.name}${this.emptyValue}${row.obj_quota}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Dataset Quota')],
  });

  quotas: DatasetQuota[] = [];
  datasetId: string;
  invalidQuotas: DatasetQuota[] = [];
  filterString = '';
  emptyType: EmptyType = EmptyType.NoPageData;
  isLoading = false;
  showAllQuotas = false;

  quotaType: QuotaData['quotaType'];
  quotaObjType: QuotaData['quotaObjType'];
  helpTextKey: QuotaData['helpTextKey'];

  protected invalidFilter: QueryParams<DatasetQuota> = [
    ['name', '=', null] as QueryFilter<DatasetQuota>,
  ] as QueryParams<DatasetQuota>;

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    protected api: ApiService,
    protected formatter: IxFormatterService,
    protected dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    protected loader: AppLoaderService,
    protected route: ActivatedRoute,
    private translate: TranslateService,
    private slideInService: SlideInService,
    private cdr: ChangeDetectorRef,
    private emptyService: EmptyService,
  ) { }

  ngOnInit(): void {
    const paramMap = this.route.snapshot.params;
    this.datasetId = paramMap.datasetId as string;
    this.getQuotaType();
    this.setDefaultSort();
  }

  private getRemoveQuotaPayload(quotas: DatasetQuota[]): SetDatasetQuota[] {
    const payload: SetDatasetQuota[] = [];
    quotas.forEach((quota) => {
      payload.push({
        id: quota.id.toString(),
        quota_type: this.quotaType,
        quota_value: 0,
      });
      payload.push({
        id: quota.id.toString(),
        quota_type: this.quotaObjType,
        quota_value: 0,
      });
    });
    return payload;
  }

  getQuotas(): void {
    this.isLoading = true;
    this.api.call('pool.dataset.get_quota', [this.datasetId, this.quotaType, []])
      .pipe(untilDestroyed(this)).subscribe({
        next: (quotas: DatasetQuota[]) => {
          this.isLoading = false;
          this.quotas = quotas.filter((quota) => quota.quota > 0 || quota.obj_quota > 0);

          if (this.showAllQuotas) {
            this.quotas = quotas;
          }

          this.onListFiltered(this.filterString);
          this.checkInvalidQuotas();
        },
        error: (error: unknown) => {
          this.emptyType = EmptyType.Errors;
          this.handleError(error);
        },
      });
  }

  handleError = (error: unknown): void => {
    this.isLoading = false;
    this.dialogService.error(this.errorHandler.parseError(error));
    this.cdr.markForCheck();
  };

  checkInvalidQuotas(): void {
    this.api.call(
      'pool.dataset.get_quota',
      [this.datasetId, this.quotaType, this.invalidFilter],
    ).pipe(untilDestroyed(this)).subscribe({
      next: (quotas: DatasetQuota[]) => {
        if (quotas?.length) {
          this.invalidQuotas = quotas;
        }
      },
      error: this.handleError,
    });
  }

  toggleDisplay(): void {
    this.showAllQuotas = !this.showAllQuotas;
    const confirm$ = !this.showAllQuotas ? this.confirmFilterQuotas() : this.confirmShowAllQuotas();

    confirm$.pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (confirmed) {
        this.getQuotas();
      } else {
        this.showAllQuotas = !this.showAllQuotas;
      }
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({ list: this.quotas, query, columnKeys: ['name', 'id', 'quota', 'obj_quota'] });

    if (!this.dataProvider.totalRows) {
      this.emptyType = EmptyType.NoSearchResults;
    }
  }

  removeInvalidQuotas(): void {
    this.getRemovalConfirmation().pipe(
      filter(Boolean),
      switchMap(() => {
        const payload = this.getRemoveQuotaPayload(this.invalidQuotas);
        return this.setQuota(payload).pipe(this.loader.withLoader());
      }),
      tap(() => {
        this.getQuotas();
      }),
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  setQuota(quotas: SetDatasetQuota[]): Observable<void> {
    return this.api.call('pool.dataset.set_quota', [this.datasetId, quotas]);
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(DatasetQuotaAddFormComponent, {
      data: { quotaType: this.quotaType, datasetId: this.datasetId },
    });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getQuotas());
  }

  private getQuotaType(): void {
    this.route.data.pipe(untilDestroyed(this)).subscribe((data: QuotaData) => {
      this.quotaType = data.quotaType;
      this.quotaObjType = data.quotaObjType;
      this.helpTextKey = data.helpTextKey;

      this.getQuotas();
    });
  }

  private confirmShowAllQuotas(): Observable<boolean> {
    return this.dialogService.confirm({
      title: helpTextQuotas[this.helpTextKey].filter_dialog.title_show,
      message: helpTextQuotas[this.helpTextKey].filter_dialog.message_show,
      hideCheckbox: true,
      buttonText: helpTextQuotas[this.helpTextKey].filter_dialog.button_show,
    });
  }

  private confirmFilterQuotas(): Observable<boolean> {
    return this.dialogService.confirm({
      title: helpTextQuotas[this.helpTextKey].filter_dialog.title_filter,
      message: helpTextQuotas[this.helpTextKey].filter_dialog.message_filter,
      hideCheckbox: true,
      buttonText: helpTextQuotas[this.helpTextKey].filter_dialog.button_filter,
    });
  }

  private doEdit(row: DatasetQuota): void {
    const slideInRef = this.slideInService.open(DatasetQuotaEditFormComponent, {
      data: { quotaType: this.quotaType, datasetId: this.datasetId, id: row.id },
    });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getQuotas());
  }

  private doDelete(row: DatasetQuota): void {
    this.confirmDelete(row.name || row.id.toString()).pipe(
      filter(Boolean),
      switchMap(() => {
        const payload = this.getRemoveQuotaPayload([row]);
        return this.setQuota(payload).pipe(this.loader.withLoader());
      }),
      tap(() => {
        this.getQuotas();
      }),
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private confirmDelete(name: string): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant(helpTextQuotas[this.helpTextKey].delete_dialog.title),
      message: this.translate.instant(helpTextQuotas[this.helpTextKey].delete_dialog.message, { name }),
      buttonText: this.translate.instant('Delete'),
      hideCheckbox: true,
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  private getRemovalConfirmation(): Observable<boolean> {
    const confirmOptions: ConfirmOptions = {
      title: this.translate.instant('Remove Invalid Quotas'),
      message: this.translate.instant(helpTextQuotas[this.helpTextKey].remove_invalid_quotas.message),
      buttonText: this.translate.instant('Remove'),
    };
    return this.dialogService.confirm(confirmOptions);
  }
}
