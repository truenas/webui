import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnChanges, OnInit, input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnCardComponent, TnTestIdDirective, type TnCardAction } from '@truenas/ui-components';
import { maxBy } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { forkJoin, Subject } from 'rxjs';
import {
  map, take, switchMap, tap,
  filter,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { DatasetType, DatasetQuotaType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { isQuotaSet } from 'app/helpers/storage.helper';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { datasetCapacityManagementElements } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.elements';
import { DatasetCapacitySettingsComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { SpaceManagementChartComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/space-management-chart/space-management-chart.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-dataset-capacity-management-card',
  templateUrl: './dataset-capacity-management-card.component.html',
  styleUrls: ['./dataset-capacity-management-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
    TnTestIdDirective,
    SpaceManagementChartComponent,
    FileSizePipe,
    RouterLink,
    NgxSkeletonLoaderModule,
    UiSearchDirective,
  ],
})
export class DatasetCapacityManagementCardComponent implements OnChanges, OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);
  private datasetStore = inject(DatasetTreeStore);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);
  private sharingTierService = inject(SharingTierService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  readonly dataset = input.required<DatasetDetails>();

  private hasDatasetWrite = toSignal(this.authService.hasRole(Role.DatasetWrite), { initialValue: false });

  protected readonly searchableElements = datasetCapacityManagementElements;
  protected readonly tierEnabled = this.sharingTierService.tierEnabled;
  protected readonly performanceTierAvailable = signal<number | null>(null);

  protected readonly isOnPerformanceTier = computed(() => {
    return this.dataset()?.tier?.tier_type === DatasetTier.Performance;
  });

  protected readonly showPerformanceTierAvailable = computed(() => {
    return this.tierEnabled() && this.isOnPerformanceTier() && this.performanceTierAvailable() !== null;
  });

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
    return !this.dataset().locked && this.isFilesystem() && !this.dataset().readonly.parsed;
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

  protected readonly editAction = computed<TnCardAction | undefined>(() => {
    if (this.isZvol() || !this.hasDatasetWrite()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Edit'),
      testId: 'edit-quotas',
      handler: () => this.editDataset(),
    };
  });

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    this.getInheritedQuotas();
    const selectedDatasetHasChanged = changes?.dataset?.previousValue?.id !== changes?.dataset?.currentValue?.id;
    if (selectedDatasetHasChanged && this.checkQuotas()) {
      this.refreshQuotas$.next();
    }
    if (selectedDatasetHasChanged) {
      this.loadPerformanceTierAvailable();
    }
  }

  ngOnInit(): void {
    if (this.checkQuotas()) {
      this.initQuotas();
      this.refreshQuotas$.next();
    }
    this.sharingTierService.getTierConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadPerformanceTierAvailable();
        this.cdr.markForCheck();
      });
  }

  private loadPerformanceTierAvailable(): void {
    if (!this.tierEnabled() || !this.isOnPerformanceTier() || !this.dataset()?.pool) {
      this.performanceTierAvailable.set(null);
      return;
    }
    this.api.call('zpool.query', [{
      pool_names: [this.dataset().pool],
      properties: ['class_special_available'],
    }]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (zpools) => {
        const special = Number(zpools[0]?.properties?.class_special_available?.value ?? 0);
        this.performanceTierAvailable.set(special);
        this.cdr.markForCheck();
      },
      error: () => {
        this.performanceTierAvailable.set(null);
        this.cdr.markForCheck();
      },
    });
  }

  private initQuotas(): void {
    this.refreshQuotas$.pipe(
      tap(() => {
        this.isLoadingQuotas = true;
        this.cdr.markForCheck();
      }),
      switchMap(() => forkJoin([
        this.api.call('pool.dataset.get_quota', [this.dataset().id, DatasetQuotaType.User, []]),
        this.api.call('pool.dataset.get_quota', [this.dataset().id, DatasetQuotaType.Group, []]),
      ])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([userQuotas, groupQuotas]) => {
        this.userQuotas = userQuotas.filter(isQuotaSet).length;
        this.groupQuotas = groupQuotas.filter(isQuotaSet).length;
        this.isLoadingQuotas = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoadingQuotas = false;
        this.errorHandler.showErrorModal(error);
        this.cdr.markForCheck();
      },
    });
  }

  private getInheritedQuotas(): void {
    this.datasetStore.selectedBranch$.pipe(
      filter((branch): branch is DatasetDetails[] => !!(branch)),
      map((datasets) => {
        const datasetWithQuotas = datasets.filter((dataset) => Boolean(dataset?.quota?.parsed));
        return maxBy(datasetWithQuotas, (dataset) => dataset.quota.parsed);
      }),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (dataset) => {
        this.inheritedQuotasDataset = dataset;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  editDataset(): void {
    this.formPanel.open(DatasetCapacitySettingsComponent, {
      wide: true,
      title: this.translate.instant('Capacity Settings'),
      inputs: { datasetToEdit: this.dataset() },
    })
      .onSuccess(() => this.datasetStore.datasetUpdated(), this.destroyRef);
  }
}
