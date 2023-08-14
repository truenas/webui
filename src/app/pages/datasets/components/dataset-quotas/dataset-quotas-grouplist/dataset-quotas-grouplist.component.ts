import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild, ChangeDetectionStrategy,
  OnDestroy, Inject,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { Job } from 'app/interfaces/job.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './dataset-quotas-grouplist.component.html',
  styleUrls: ['./dataset-quotas-grouplist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetQuotasGrouplistComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  datasetId: string;
  dataSource = new MatTableDataSource<DatasetQuota>([]);
  invalidQuotas: DatasetQuota[] = [];
  displayedColumns: string[] = ['name', 'id', 'quota', 'used_bytes', 'used_percent', 'obj_quota', 'obj_used', 'obj_used_percent', 'actions'];
  defaultSort: Sort = { active: 'id', direction: 'asc' };

  isLoading = false;
  readonly EmptyType = EmptyType;

  emptyType: EmptyType = EmptyType.NoPageData;

  useFullFilter = true;
  protected invalidFilter: QueryParams<DatasetQuota> = [['name', '=', null] as QueryFilter<DatasetQuota>] as QueryParams<DatasetQuota>;

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    protected ws: WebSocketService,
    protected storageService: StorageService,
    protected formatter: IxFormatterService,
    private errorHandler: ErrorHandlerService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected aroute: ActivatedRoute,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
    private emptyService: EmptyService,
  ) { }

  ngOnInit(): void {
    const paramMap = this.aroute.snapshot.params;
    this.datasetId = paramMap.datasetId as string;
    this.useFullFilter = this.window.localStorage.getItem('useFullFilter') !== 'false';
    this.getGroupQuotas();
  }

  ngOnDestroy(): void {
    this.window.localStorage.setItem('useFullFilter', 'true');
  }

  handleError = (error: WebsocketError | Job): void => {
    this.dialogService.error(this.errorHandler.parseError(error));
  };

  renderRowValue(row: DatasetQuota, field: string): string | number {
    if (row[field as keyof DatasetQuota] === undefined) {
      return '—';
    }
    switch (field) {
      case 'name':
        if (!row[field]) {
          return `*ERR* (${this.translate.instant(helptext.shared.nameErr)}), ID: ${row.id}`;
        }
        return row[field];
      case 'quota':
        return this.formatter.convertBytesToHumanReadable(row[field], 0);
      case 'used_percent':
        return `${Math.round(row[field] * 100) / 100}%`;
      case 'obj_used_percent':
        return row.obj_quota ? `${Math.round(row.obj_used / row.obj_quota * 100) / 100}%` : '—';
      case 'obj_quota':
        return row.obj_quota ? row.obj_quota : '—';
      case 'used_bytes':
        if (row[field] !== 0) {
          return this.formatter.convertBytesToHumanReadable(row[field], 2);
        }
        return row[field];
      default:
        return row[field as keyof DatasetQuota];
    }
  }

  private getRemoveQuotaPayload(quotas: DatasetQuota[]): SetDatasetQuota[] {
    const payload: SetDatasetQuota[] = [];
    for (const quota of quotas) {
      payload.push({
        id: quota.id.toString(),
        quota_type: DatasetQuotaType.Group,
        quota_value: 0,
      });
      payload.push({
        id: quota.id.toString(),
        quota_type: DatasetQuotaType.GroupObj,
        quota_value: 0,
      });
    }
    return payload;
  }

  getGroupQuotas(): void {
    this.isLoading = true;
    this.ws.call(
      'pool.dataset.get_quota',
      [this.datasetId, DatasetQuotaType.Group, []],
    ).pipe(untilDestroyed(this)).subscribe({
      next: (quotas: DatasetQuota[]) => {
        this.isLoading = false;
        if (this.useFullFilter) {
          quotas = quotas.filter((quota) => quota.quota > 0 || quota.obj_quota > 0);
        }
        this.createDataSource(quotas);
        this.checkInvalidQuotas();
      },
      error: (error) => {
        this.emptyType = EmptyType.Errors;
        this.handleError(error);
      },
    });
  }

  createDataSource(quotas: DatasetQuota[] = []): void {
    if (!quotas.length) {
      this.emptyType = EmptyType.NoPageData;
    } else {
      this.emptyType = EmptyType.NoSearchResults;
    }
    this.dataSource = new MatTableDataSource(quotas);
    this.dataSource.sort = this.sort;
    this.cdr.markForCheck();
  }

  checkInvalidQuotas(): void {
    this.ws.call(
      'pool.dataset.get_quota',
      [this.datasetId, DatasetQuotaType.Group, this.invalidFilter],
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
    this.useFullFilter = !this.useFullFilter;
    const confirm$ = this.useFullFilter ? this.confirmFilterUsers() : this.confirmShowAllUsers();
    confirm$.pipe(
      untilDestroyed(this),
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.window.localStorage.setItem('useFullFilter', this.useFullFilter.toString());
        this.getGroupQuotas();
      } else {
        this.useFullFilter = !this.useFullFilter;
      }
    });
  }

  private confirmShowAllUsers(): Observable<boolean> {
    return this.dialogService.confirm({
      title: helptext.groups.filter_dialog.title_show,
      message: helptext.groups.filter_dialog.message_show,
      hideCheckbox: true,
      buttonText: helptext.groups.filter_dialog.button_show,
    });
  }

  private confirmFilterUsers(): Observable<boolean> {
    return this.dialogService.confirm({
      title: helptext.groups.filter_dialog.title_filter,
      message: helptext.groups.filter_dialog.message_filter,
      hideCheckbox: true,
      buttonText: helptext.groups.filter_dialog.button_filter,
    });
  }

  removeInvalidQuotas(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Remove Invalid Quotas'),
      message: this.translate.instant('This action will set all dataset quotas for the removed or invalid groups to 0, \
      virtually removing any dataset quota entries for such groups. \
      Are you sure you want to proceed?'),
      buttonText: this.translate.instant('Remove'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('pool.dataset.set_quota', [this.datasetId, this.getRemoveQuotaPayload(this.invalidQuotas)]).pipe(
          this.loader.withLoader(),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getGroupQuotas();
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(DatasetQuotaAddFormComponent, {
      data: { quotaType: DatasetQuotaType.Group, datasetId: this.datasetId },
    });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.getGroupQuotas());
  }

  doEdit(row: DatasetQuota): void {
    const slideInRef = this.slideInService.open(DatasetQuotaEditFormComponent, {
      data: { quotaType: DatasetQuotaType.Group, datasetId: this.datasetId, id: row.id },
    });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.getGroupQuotas());
  }

  doDelete(row: DatasetQuota): void {
    this.confirmDelete(row).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.setQuota(row).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
        );
      }),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getGroupQuotas();
    });
  }

  private confirmDelete(quota: DatasetQuota): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant('Delete Group Quota'),
      message: this.translate.instant('Are you sure you want to delete the group quota <b>{name}</b>?', { name: quota.name }),
      buttonText: this.translate.instant('Delete'),
      hideCheckbox: true,
    });
  }

  setQuota(quota: DatasetQuota): Observable<void> {
    return this.ws.call('pool.dataset.set_quota', [this.datasetId, this.getRemoveQuotaPayload([quota])]);
  }

  filter(query: string): void {
    this.dataSource.filter = query;
  }
}
