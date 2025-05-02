import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { switchMap, forkJoin, finalize } from 'rxjs';
import {
  filter, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { getResilverSummary } from 'app/pages/system/advanced/storage/storage-card/resilver-summary.util';
import { storageCardElements } from 'app/pages/system/advanced/storage/storage-card/storage-card.elements';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@UntilDestroy()
@Component({
  selector: 'ix-storage-card',
  styleUrls: ['../../../general-settings/common-settings-card.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    TranslateModule,
    NgxSkeletonLoaderModule,
  ],
})
export class StorageCardComponent implements OnInit {
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

  constructor(
    private slideIn: SlideIn,
    private firstTimeWarning: FirstTimeWarningService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private api: ApiService,
  ) {}

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
        untilDestroyed(this),
      )
      .subscribe(([systemDatasetConfig, resilverConfig]) => {
        this.systemDatasetPool.set(systemDatasetConfig.pool);
        this.resilverConfig.set(resilverConfig);
      });
  }

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => {
        return this.slideIn.open(StorageSettingsFormComponent, {
          data: {
            systemDatasetPool: this.systemDatasetPool(),
            priorityResilver: this.resilverConfig(),
          },
        });
      }),
      filter((response) => !!response.response),
      tap(() => this.loadConfig()),
      untilDestroyed(this),
    ).subscribe();
  }
}
