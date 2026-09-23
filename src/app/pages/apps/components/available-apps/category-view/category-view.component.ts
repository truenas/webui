import { AsyncPipe, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnInputComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  BehaviorSubject,
  debounceTime, distinctUntilChanged, map,
} from 'rxjs';
import { noSearchResultsConfig } from 'app/constants/empty-configs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import {
  categorySearchParam,
} from 'app/pages/apps/components/available-apps/category-search-param.constant';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@Component({
  selector: 'ix-category-view',
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CustomAppButtonComponent,
    NgxSkeletonLoaderModule,
    AsyncPipe,
    ReactiveFormsModule,
    TnTestIdDirective,
    AppCardComponent,
    EmptyComponent,
    TranslateModule,
    TnButtonComponent,
    TnInputComponent,
    TitleCasePipe,
    RouterLink,
  ],
})
export class CategoryViewComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private applicationsStore = inject(AppsStore);
  private appsFilterStore = inject(AppsFilterStore);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly category = toSignal(this.activatedRoute.params.pipe(map((params) => params['category'] as string)));
  pageTitle$ = new BehaviorSubject('Category');
  apps$ = this.appsFilterStore.searchedFilteredApps$;
  isLoading$ = this.applicationsStore.isLoading$;
  searchQuery$ = this.appsFilterStore.searchQuery$;

  protected searchControl = this.fb.nonNullable.control('');

  ngOnInit(): void {
    const category = this.category();
    if (!category) {
      console.error('Missing category parameter');
      this.router.navigate(['/apps']);
      return;
    }

    this.pageTitle$.next(category.replace(/-/g, ' '));
    this.appsFilterStore.applyFilters({
      categories: [category],
      sort: null,
    });

    this.setUpSearch();
  }

  ngOnDestroy(): void {
    // Keeps the search term, so that going back to Discover does not silently drop it.
    this.appsFilterStore.resetFiltersKeepingSearch();
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.latest_version}-${app.train}-${app.name}`;
  }

  /**
   * The query parameter is the single source of truth here: it carries the term over from the
   * Discover page, survives a reload and makes a searched category shareable as a link.
   */
  private setUpSearch(): void {
    const searchQuery = this.activatedRoute.snapshot.queryParamMap.get(categorySearchParam) || '';
    this.searchControl.setValue(searchQuery, { emitEvent: false });
    this.appsFilterStore.applySearchQuery(searchQuery);

    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((query) => {
      this.appsFilterStore.applySearchQuery(query);
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { [categorySearchParam]: query || null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  protected readonly noSearchResultsConfig = noSearchResultsConfig;
  protected readonly tnIconMarker = tnIconMarker;
}
