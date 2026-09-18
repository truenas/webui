import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnChanges, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@Component({
  selector: 'ix-app-details-similar',
  templateUrl: './app-details-similar.component.html',
  styleUrls: ['./app-details-similar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    NgxSkeletonLoaderModule,
    AppCardComponent,
    RouterLink,
    TnTestIdDirective,
  ],
})
export class AppDetailsSimilarComponent implements OnChanges {
  protected router = inject(Router);
  private appService = inject(ApplicationsService);
  private destroyRef = inject(DestroyRef);

  readonly app = input.required<AvailableApp>();

  protected isLoading = signal(false);
  protected similarApps = signal<AvailableApp[]>([]);
  protected loadingError = signal<unknown>(null);

  private readonly maxSimilarApps = 6;

  /**
   * App names carry digits (`n8n`, `netbox3`), and the library's kebab-casing does not split a
   * letter→digit boundary the way lodash does — so the name is pre-normalized here to keep
   * `link-open-stable-n-8-n` byte-identical. Normalizing once, when the apps arrive, also keeps
   * the array out of every change-detection pass. See {@link normalizeTestIdParts}.
   */
  protected readonly similarAppLinks = computed(() => this.similarApps().map((app) => ({
    app,
    testId: normalizeTestIdParts(['open', app.train, app.name]),
  })));

  ngOnChanges(): void {
    this.loadSimilarApps();
  }

  private loadSimilarApps(): void {
    this.isLoading.set(true);
    this.appService.getSimilarApps(this.app()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (apps) => {
        this.isLoading.set(false);
        this.similarApps.set(apps.slice(0, this.maxSimilarApps));
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        console.error(error);
        this.loadingError.set(error);
      },
    });
  }

  trackByAppId(_: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }
}
