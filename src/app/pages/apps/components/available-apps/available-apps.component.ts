import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Router, NavigationSkipped, Params,
  RouterLink,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnTestIdDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { availableAppsElements } from 'app/pages/apps/components/available-apps/available-apps.elements';
import {
  categorySearchParam,
} from 'app/pages/apps/components/available-apps/category-search-param.constant';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@Component({
  selector: 'ix-available-apps',
  templateUrl: './available-apps.component.html',
  styleUrls: ['./available-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CustomAppButtonComponent,
    AvailableAppsHeaderComponent,
    FakeProgressBarComponent,
    TranslateModule,
    NgTemplateOutlet,
    NgxSkeletonLoaderModule,
    AppCardComponent,
    TnTestIdDirective,
    TnButtonComponent,
    UiSearchDirective,
    RouterLink,
  ],
})
export class AvailableAppsComponent implements OnInit {
  protected router = inject(Router);
  protected applicationsStore = inject(AppsStore);
  protected appsFilterStore = inject(AppsFilterStore);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = availableAppsElements;

  protected readonly showViewMoreButton = computed(() => {
    const appsFilter = this.appsFilterStore.filterValues();
    return !appsFilter.sort && !appsFilter.categories?.length;
  });

  protected readonly isFilterOrSearch = computed(() => {
    return !!this.appsFilterStore.searchQuery() || this.appsFilterStore.isFilterApplied();
  });

  protected readonly isLoading = this.applicationsStore.isLoading;
  protected readonly isFiltering = this.appsFilterStore.isFiltering;

  /**
   * Carries the search term into the category view the "View All" buttons link to, so that
   * drilling into a category does not throw the search away.
   */
  protected readonly searchQueryParams = computed<Params>(() => {
    const searchQuery = this.appsFilterStore.searchQuery();
    return searchQuery ? { [categorySearchParam]: searchQuery } : {};
  });

  ngOnInit(): void {
    // For clicking the breadcrumbs link to this page
    this.router.events.pipe(
      filter((event) => event instanceof NavigationSkipped),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (this.router.url.endsWith('/apps/available')) {
        this.appsFilterStore.resetFilters();
      }
    });
  }

  protected trackByAppId(_: number, app: AvailableApp): string {
    return `${app.train}-${app.name}`;
  }
}
