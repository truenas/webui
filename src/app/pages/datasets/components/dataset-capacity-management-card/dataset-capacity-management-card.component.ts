import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, OnInit, input, computed,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { maxBy } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { forkJoin, Subject } from 'rxjs';
import {
  map, take, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DatasetType, DatasetQuotaType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { datasetCapacityManagementElements } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.elements';
import { DatasetCapacitySettingsComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { SpaceManagementChartComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/space-management-chart/space-management-chart.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-capacity-management-card',
  templateUrl: './dataset-capacity-management-card.component.html',
  styleUrls: ['./dataset-capacity-management-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardHeader,
    TranslateModule,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    MatCardContent,
    SpaceManagementChartComponent,
    FileSizePipe,
    RouterLink,
    NgxSkeletonLoaderModule,
    UiSearchDirective,
  ],
})
export class DatasetCapacityManagementCardComponent implements OnChanges, OnInit {
  readonly dataset = input.required<DatasetDetails>();

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly searchableElements = datasetCapacityManagementElements;

  refreshQuotas$ = new Subject<void>();
  inheritedQuotasDataset: DatasetDetails;
  isLoadingQuotas = false;
  userQuotas: number;
  groupQuotas: number;

  protected isFilesystem = computed(() => {
    return this.dataset().type === DatasetType.Filesystem;
  });

  protected isZvol = computed(() => {
    return this.dataset().type === DatasetType.Volume;
  });

  protected checkQuotas = computed(() => {
    return !this.dataset().locked && this.isFilesystem() && !this.dataset().readonly;
  });

  protected hasQuota = computed(() => {
    return Boolean(this.dataset()?.quota?.parsed);
  });

  protected hasRefQuota = computed(() => {
    return Boolean(this.dataset()?.refquota?.parsed);
  });

  protected hasInheritedQuotas = computed(() => {
    return this.inheritedQuotasDataset?.quota?.parsed && this.inheritedQuotasDataset?.id !== this.dataset()?.id;
  });

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private datasetStore: DatasetTreeStore,
    private slideInService: SlideInService,
    private dialogService: DialogService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    this.getInheritedQuotas();
    const selectedDatasetHasChanged = changes?.dataset?.previousValue?.id !== changes?.dataset?.currentValue?.id;
    if (selectedDatasetHasChanged && this.checkQuotas()) {
      this.refreshQuotas$.next();
    }
  }

  ngOnInit(): void {
    if (this.checkQuotas()) {
      this.initQuotas();
      this.refreshQuotas$.next();
    }
  }

  initQuotas(): void {
    this.refreshQuotas$.pipe(
      tap(() => {
        this.isLoadingQuotas = true;
        this.cdr.markForCheck();
      }),
      switchMap(() => forkJoin([
        this.api.call('pool.dataset.get_quota', [this.dataset().id, DatasetQuotaType.User, []]),
        this.api.call('pool.dataset.get_quota', [this.dataset().id, DatasetQuotaType.Group, []]),
      ])),
      untilDestroyed(this),
    ).subscribe({
      next: ([userQuotas, groupQuotas]) => {
        this.userQuotas = userQuotas.length;
        this.groupQuotas = groupQuotas.length;
        this.isLoadingQuotas = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoadingQuotas = false;
        this.dialogService.error(this.errorHandler.parseError(error));
        this.cdr.markForCheck();
      },
    });
  }

  getInheritedQuotas(): void {
    this.datasetStore.selectedBranch$.pipe(
      map((datasets) => {
        const datasetWithQuotas = datasets.filter((dataset) => Boolean(dataset?.quota?.parsed));
        return maxBy(datasetWithQuotas, (dataset) => dataset.quota.parsed);
      }),
      take(1),
      untilDestroyed(this),
    ).subscribe({
      next: (dataset) => {
        this.inheritedQuotasDataset = dataset;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  editDataset(): void {
    this.slideInService
      .open(DatasetCapacitySettingsComponent, { wide: true, data: this.dataset() })
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.datasetStore.datasetUpdated();
      });
  }
}
