import { ChangeDetectionStrategy, Component, input, OnChanges, output, TrackByFunction, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { findIndex, isEqual } from 'lodash-es';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { processHierarchy } from 'app/modules/global-search/helpers/process-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-global-search-results',
  templateUrl: './global-search-results.component.html',
  styleUrls: ['./global-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    TestDirective,
    TnIconComponent,
    MatButton,
    TranslateModule,
  ],
})
export class GlobalSearchResultsComponent implements OnChanges {
  protected authService = inject(AuthService);
  private searchProvider = inject(UiSearchProvider);
  private globalSearchSectionsProvider = inject(GlobalSearchSectionsProvider);
  private router = inject(Router);
  private window = inject<Window>(WINDOW);

  readonly searchTerm = input('');
  readonly isLoading = input(false);
  readonly isSearchInputFocused = input(false);
  readonly results = input<UiSearchableElement[]>([]);

  readonly recentSearchRemoved = output();

  readonly GlobalSearchSection = GlobalSearchSection;
  readonly initialResultsLimit = this.globalSearchSectionsProvider.globalSearchInitialLimit;
  readonly trackBySection: TrackByFunction<Option<GlobalSearchSection>> = (_, section) => section.value;

  processHierarchy = processHierarchy;

  initialShowAll: Record<GlobalSearchSection, boolean> = Object.fromEntries(
    Object.values(GlobalSearchSection).map((section) => [section, false]),
  ) as Record<GlobalSearchSection, boolean>;

  showAll = { ...this.initialShowAll };

  get availableSections(): Option<GlobalSearchSection>[] {
    const uniqueSectionValues = new Set(this.results().map((result) => result.section));

    if (
      this.searchTerm()
      && !uniqueSectionValues.has(GlobalSearchSection.Ui)
      && !uniqueSectionValues.has(GlobalSearchSection.RecentSearches)
    ) {
      uniqueSectionValues.add(GlobalSearchSection.Ui);
    }

    return this.globalSearchSectionsProvider.searchSections.filter(
      (sectionOption) => uniqueSectionValues.has(sectionOption.value),
    );
  }

  get firstAvailableSearchResult(): UiSearchableElement | null {
    return this.availableSections.flatMap((section) => this.getLimitedSectionResults(section.value))[0];
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.searchTerm) {
      this.showAll = { ...this.initialShowAll };
    }
  }

  selectElement(element: UiSearchableElement): void {
    this.saveSearchResult(element);
    this.searchProvider.select(element);

    const route = element.anchorRouterLink || element.routerLink;
    if (route?.length) {
      const hasWildcard = route[route.length - 1] === '*';
      const navigateTo = hasWildcard ? route.slice(0, -1) : route;

      // Convention: `anchorRouterLink` / `routerLink` always start with `/`
      // (verified across all `*.elements.ts` files). We resolve via the
      // router so the segments serialise to the same absolute string format
      // as `router.url`, making the equality / startsWith comparisons below
      // exact. `createUrlTree` without `relativeTo` resolves from
      // `routerState.snapshot.root`, so even if a non-absolute route ever
      // sneaks in it serialises from root rather than the active route.
      const targetPath = this.router.serializeUrl(this.router.createUrlTree(navigateTo))
        .split('?')[0].split('#')[0];

      // Skip navigation when we're already on the target page — even same-URL
      // `router.navigate` calls fire `NavigationSkipped` events that
      // master-detail views interpret as "page changed".
      // Prefix-startsWith only applies when the route opts in with a trailing
      // `*` (master-detail descendants like `/datasets/<pool>`). Without it
      // we'd treat sibling pages such as `/credentials/users/api-keys` as a
      // descendant of `/credentials/users` and skip the navigation the user
      // actually asked for.
      const currentPath = this.router.url.split('?')[0].split('#')[0];
      const onTargetPath = currentPath === targetPath
        || (hasWildcard && currentPath.startsWith(`${targetPath}/`));
      if (!onTargetPath) {
        this.router.navigate(navigateTo);
      }
    }

    if (element.targetHref) {
      this.window.open(element.targetHref, '_blank');
    }
  }

  toggleShowAll(section: GlobalSearchSection): void {
    this.showAll[section] = !this.showAll[section];
  }

  getLimitedSectionResults(section: GlobalSearchSection): UiSearchableElement[] {
    const sectionResults = this.results().filter((element) => element.section === section);

    if (this.showAll[section] || sectionResults.length <= this.initialResultsLimit) {
      return sectionResults;
    }

    return sectionResults.slice(0, this.initialResultsLimit);
  }

  getElementsBySection(section: GlobalSearchSection): UiSearchableElement[] {
    return this.results().filter((element) => element?.section === section);
  }

  isSameHierarchyResult(a: UiSearchableElement | null, b: UiSearchableElement | null): boolean {
    return Boolean(a && b && isEqual(a.hierarchy, b.hierarchy));
  }

  removeRecentSearch(event: Event, result: UiSearchableElement): void {
    event.stopPropagation();

    const existingResults = this.readRecentSearches();
    const updatedResults = existingResults.filter((item) => !isEqual(item.hierarchy, result.hierarchy));
    this.window.localStorage.setItem('recentSearches', JSON.stringify(updatedResults));
    this.recentSearchRemoved.emit();
  }

  private readRecentSearches(): UiSearchableElement[] {
    try {
      const parsed: unknown = JSON.parse(this.window.localStorage.getItem('recentSearches') || '[]');
      return Array.isArray(parsed) ? parsed as UiSearchableElement[] : [];
    } catch {
      return [];
    }
  }

  private saveSearchResult(result: UiSearchableElement): void {
    const existingResults = this.readRecentSearches();
    const existingIndex = findIndex(existingResults, (item) => isEqual(item.hierarchy, result.hierarchy));

    if (existingIndex !== -1) existingResults.splice(existingIndex, 1);

    existingResults.unshift(result);

    this.window.localStorage.setItem('recentSearches', JSON.stringify(
      existingResults
        .slice(0, this.globalSearchSectionsProvider.recentSearchesMaximumToSave)
        .map((item) => ({ ...item, section: GlobalSearchSection.RecentSearches })),
    ));
  }
}
