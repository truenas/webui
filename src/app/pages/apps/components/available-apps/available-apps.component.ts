import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  Router, NavigationSkipped,
  RouterLink,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  Observable, combineLatest, filter, map,
} from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { availableAppsElements } from 'app/pages/apps/components/available-apps/available-apps.elements';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps',
  templateUrl: './available-apps.component.html',
  styleUrls: ['./available-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    CustomAppButtonComponent,
    AvailableAppsHeaderComponent,
    FakeProgressBarComponent,
    AsyncPipe,
    TranslateModule,
    NgTemplateOutlet,
    NgxSkeletonLoaderModule,
    AppCardComponent,
    TestDirective,
    MatButton,
    UiSearchDirective,
    RouterLink,
  ],
})
export class AvailableAppsComponent implements OnInit {
  protected readonly searchableElements = availableAppsElements;

  showViewMoreButton$: Observable<boolean> = this.appsFilterStore.filterValues$.pipe(
    map((appsFilter) => {
      return !appsFilter.sort && !appsFilter.categories.length;
    }),
  );

  isFilterOrSearch$: Observable<boolean> = combineLatest([
    this.appsFilterStore.searchQuery$,
    this.appsFilterStore.isFilterApplied$,
  ]).pipe(
    map(([searchQuery, isFilterApplied]) => {
      return !!searchQuery || isFilterApplied;
    }),
  );

  isLoading$ = this.applicationsStore.isLoading$;
  isFiltering$ = this.appsFilterStore.isFiltering$;

  constructor(
    protected router: Router,
    protected applicationsStore: AppsStore,
    protected appsFilterStore: AppsFilterStore,
  ) { }

  ngOnInit(): void {
    // For clicking the breadcrumbs link to this page
    this.router.events.pipe(
      filter((event) => event instanceof NavigationSkipped),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.router.url.endsWith('/apps/available')) {
        this.appsFilterStore.resetFilters();
      }
    });
  }

  trackByAppId(_: number, app: AvailableApp): string {
    return `${app.train}-${app.name}`;
  }
}
