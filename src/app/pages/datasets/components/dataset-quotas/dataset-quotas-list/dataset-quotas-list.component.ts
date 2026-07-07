import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnSlideToggleComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  type TnSortEvent,
} from '@truenas/ui-components';
import { EMPTY, Observable, of } from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { isQuotaSet } from 'app/helpers/storage.helper';
import { helptextQuotas } from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DatasetQuotaAddFormComponent,
} from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import {
  DatasetQuotaEditFormComponent,
} from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface QuotaData {
  quotaType: DatasetQuotaType.User | DatasetQuotaType.Group;
  quotaObjType: DatasetQuotaType.UserObj | DatasetQuotaType.GroupObj;
  helpTextKey: 'users' | 'groups';
}

@Component({
  selector: 'ix-dataset-quotas-list',
  templateUrl: './dataset-quotas-list.component.html',
  styleUrls: ['./dataset-quotas-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    FormsModule,
    TnSlideToggleComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TnTablePagerComponent,
    AsyncPipe,
  ],
})
export class DatasetQuotasListComponent implements OnInit {
  protected api = inject(ApiService);
  protected formatter = inject(IxFormatterService);
  protected dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  protected loader = inject(LoaderService);
  protected route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DatasetWrite];
  readonly emptyValue = '—';
  readonly helpText = helptextQuotas;

  dataProvider = new ArrayDataProvider<DatasetQuota>();

  protected readonly displayedColumns = [
    'name', 'id', 'quota', 'used_bytes', 'used_percent', 'obj_quota', 'obj_used', 'obj_used_percent', 'actions',
  ];

  protected readonly trackByQuotaId = (_: number, row: DatasetQuota): number => row.id;

  protected readonly actions: IconActionConfig<DatasetQuota>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      hidden: (row) => of(!(row.quota > 0 || row.obj_quota > 0)),
      requiredRoles: this.requiredRoles,
    },
  ];

  quotas: DatasetQuota[] = [];
  datasetId: string;
  invalidQuotas: DatasetQuota[] = [];
  searchQuery = signal('');
  emptyType: EmptyType = EmptyType.NoPageData;
  isLoading = false;
  showAllQuotas = false;

  quotaType: QuotaData['quotaType'];
  quotaObjType: QuotaData['quotaObjType'];
  helpTextKey: QuotaData['helpTextKey'];

  protected invalidFilter: QueryParams<DatasetQuota> = [
    ['name', '=', null] as QueryFilter<DatasetQuota>,
  ] as QueryParams<DatasetQuota>;

  ngOnInit(): void {
    const paramMap = this.route.snapshot.params;
    this.datasetId = paramMap.datasetId as string;
    this.getQuotaType();
    this.setDefaultSort();
  }

  protected nameValue(row: DatasetQuota): string {
    return row.name || this.emptyValue;
  }

  protected quotaValue(row: DatasetQuota): string {
    return row.quota >= 0 ? this.formatter.convertBytesToHumanReadable(row.quota, 0) : this.emptyValue;
  }

  protected usedBytesValue(row: DatasetQuota): string {
    return row.used_bytes >= 0 ? this.formatter.convertBytesToHumanReadable(row.used_bytes, 2) : this.emptyValue;
  }

  protected usedPercentValue(row: DatasetQuota): string {
    return row.used_percent >= 0 ? `${Math.round(row.used_percent * 100) / 100}%` : this.emptyValue;
  }

  protected objQuotaValue(row: DatasetQuota): string | number {
    return row.obj_quota || this.emptyValue;
  }

  protected objUsedValue(row: DatasetQuota): string | number {
    return row.obj_used || this.emptyValue;
  }

  protected objUsedPercentValue(row: DatasetQuota): string {
    if (row.obj_used && row.obj_quota) {
      return `${Math.round(row.obj_used / row.obj_quota * 100) / 100}%`;
    }
    return this.emptyValue;
  }

  protected uniqueRowTag(row: DatasetQuota): string {
    return convertStringToId(`${this.helpTextKey}-quota-${row.name}${this.emptyValue}${row.obj_quota}`);
  }

  protected ariaLabel(row: DatasetQuota): string {
    return [row.name, this.translate.instant('Dataset Quota')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<DatasetQuota>(event, this.displayedColumns));
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
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (quotas: DatasetQuota[]) => {
          this.isLoading = false;
          this.quotas = quotas.filter(isQuotaSet);

          if (this.showAllQuotas) {
            this.quotas = quotas;
          }

          this.onListFiltered(this.searchQuery());
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
    this.errorHandler.showErrorModal(error);
    this.cdr.markForCheck();
  };

  private checkInvalidQuotas(): void {
    this.api.call(
      'pool.dataset.get_quota',
      [this.datasetId, this.quotaType, this.invalidFilter],
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (quotas: DatasetQuota[]) => {
        if (quotas?.length) {
          this.invalidQuotas = quotas;
        }
      },
      error: this.handleError,
    });
  }

  toggleDisplay(newValue: boolean): void {
    this.showAllQuotas = newValue;
    const confirm$ = !this.showAllQuotas ? this.confirmFilterQuotas() : this.confirmShowAllQuotas();

    confirm$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (confirmed) {
        this.getQuotas();
      } else {
        this.showAllQuotas = !this.showAllQuotas;
        this.cdr.markForCheck();
      }
    });
  }

  onListFiltered(query: string): void {
    this.searchQuery.set(query);
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private setQuota(quotas: SetDatasetQuota[]): Observable<void> {
    return this.api.call('pool.dataset.set_quota', [this.datasetId, quotas]);
  }

  doAdd(): void {
    this.formPanel.open(DatasetQuotaAddFormComponent, {
      title: this.quotaType === DatasetQuotaType.User
        ? this.translate.instant('Add User Quotas')
        : this.translate.instant('Add Group Quotas'),
      inputs: { datasetId: this.datasetId, quotaType: this.quotaType },
    }).onSuccess(() => this.getQuotas(), this.destroyRef);
  }

  private getQuotaType(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: QuotaData) => {
      this.quotaType = data.quotaType;
      this.quotaObjType = data.quotaObjType;
      this.helpTextKey = data.helpTextKey;

      this.getQuotas();
    });
  }

  private confirmShowAllQuotas(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptextQuotas[this.helpTextKey].filterDialog.showTitle),
      message: this.translate.instant(helptextQuotas[this.helpTextKey].filterDialog.showMessage),
      hideCheckbox: true,
      buttonText: this.translate.instant(helptextQuotas[this.helpTextKey].filterDialog.showButton),
    });
  }

  private confirmFilterQuotas(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptextQuotas[this.helpTextKey].filterDialog.filterTitle),
      message: this.translate.instant(helptextQuotas[this.helpTextKey].filterDialog.filterMessage),
      hideCheckbox: true,
      buttonText: this.translate.instant(helptextQuotas[this.helpTextKey].filterDialog.filterButton),
    });
  }

  private doEdit(row: DatasetQuota): void {
    this.formPanel.open(DatasetQuotaEditFormComponent, {
      title: this.quotaType === DatasetQuotaType.User
        ? this.translate.instant('Edit User Quota')
        : this.translate.instant('Edit Group Quota'),
      inputs: { datasetId: this.datasetId, quotaType: this.quotaType, quotaId: row.id },
    }).onSuccess(() => this.getQuotas(), this.destroyRef);
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private confirmDelete(name: string): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptextQuotas[this.helpTextKey].deleteDialog.title),
      message: this.translate.instant(helptextQuotas[this.helpTextKey].deleteDialog.message, { name }),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
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
      message: this.translate.instant(helptextQuotas[this.helpTextKey].removeInvalidQuotas.message),
      buttonText: this.translate.instant('Remove'),
      buttonColor: 'warn',
    };
    return this.dialogService.confirm(confirmOptions);
  }
}
