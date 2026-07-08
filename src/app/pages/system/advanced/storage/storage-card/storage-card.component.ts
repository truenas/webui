import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { finalize, forkJoin, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { getResilverSummary } from 'app/pages/system/advanced/storage/storage-card/resilver-summary.util';
import { storageCardElements } from 'app/pages/system/advanced/storage/storage-card/storage-card.elements';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-storage-card',
  styleUrls: ['./storage-card.component.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    NgxSkeletonLoaderModule,
  ],
})
export class StorageCardComponent implements OnInit {
  private firstTimeWarning = inject(FirstTimeWarningService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected isLoading = signal(false);
  protected systemDatasetPool = signal<string | null>(null);
  protected resilverConfig = signal<ResilverConfig | null>(null);

  protected priorityResilverSummary = computed(() => {
    const config = this.resilverConfig();
    if (!config) {
      return '';
    }

    return getResilverSummary(config, this.translate);
  });

  protected readonly searchableElements = storageCardElements;
  protected readonly requiredRoles = [Role.DatasetWrite, Role.PoolWrite];

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.call('systemdataset.config'),
      this.api.call('pool.resilver.config'),
    ])
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([systemDatasetConfig, resilverConfig]) => {
        this.systemDatasetPool.set(systemDatasetConfig.pool);
        this.resilverConfig.set(resilverConfig);
      });
  }

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(StorageSettingsFormComponent, { title: this.translate.instant('Storage') })
        .onSuccess(() => this.loadConfig(), this.destroyRef);
    });
  }
}
