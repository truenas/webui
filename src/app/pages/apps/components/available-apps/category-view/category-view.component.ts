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
  combineLatest, debounceTime, distinctUntilChanged, map, Observable, take,
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

/** Matches the debounce the Discover header's search box uses. */
const searchDebounceMs = 200;

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
  protected pageTitle$ = new BehaviorSubject('Category');
  protected apps$ = this.appsFilterStore.searchedFilteredApps$;
  protected searchQuery$ = this.appsFilterStore.searchQuery$;

  /**
   * Both stores have to be counted in: the catalog load, and the category fetch `applyFilters()`
   * kicks off. Watching only the catalog leaves the page blank - no skeletons, no cards, just the
   * "Back to Discover Page" button - for as long as the category request is in flight.
   */
  protected isLoading$: Observable<boolean> = combineLatest([
    this.applicationsStore.isLoading$,
    this.appsFilterStore.isFiltering$,
  ]).pipe(
    map(([isCatalogLoading, isFiltering]) => isCatalogLoading || isFiltering),
  );

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

  protected trackByAppId(id: number, app: AvailableApp): string {
    return `${app.latest_version}-${app.train}-${app.name}`;
  }

  /**
   * The query parameter is the source of truth here: it carries the term over from the Discover
   * page, survives a reload and makes a searched category shareable as a link. Where the URL
   * carries no parameter the term already in the store is inherited instead, so the entry points
   * that do not set one - `Show All` and the `Available Apps` count, which both link to
   * `/apps/available/all` bare - narrow the category rather than silently throwing the term away
   * (and dropping it for Discover too, on the way back). The inherited term is written into the
   * URL straight away, so the box, the grid and the address bar never disagree.
   */
  private setUpSearch(): void {
    this.appsFilterStore.searchQuery$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((storedQuery) => {
      const paramQuery = this.activatedRoute.snapshot.queryParamMap.get(categorySearchParam);
      const searchQuery = paramQuery ?? storedQuery;

      this.searchControl.setValue(searchQuery, { emitEvent: false });
      this.appsFilterStore.applySearchQuery(searchQuery);

      if (paramQuery === null && searchQuery) {
        this.writeSearchQueryToUrl(searchQuery);
      }
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(searchDebounceMs),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((query) => {
      this.appsFilterStore.applySearchQuery(query);
      this.writeSearchQueryToUrl(query);
    });
  }

  private writeSearchQueryToUrl(searchQuery: string): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [categorySearchParam]: searchQuery || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected readonly noSearchResultsConfig = noSearchResultsConfig;
  protected readonly tnIconMarker = tnIconMarker;
}
