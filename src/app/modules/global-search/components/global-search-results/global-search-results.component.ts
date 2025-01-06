import {
  ChangeDetectionStrategy, Component, Inject, input, OnChanges, output, TrackByFunction,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
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
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-global-search-results',
  templateUrl: './global-search-results.component.html',
  styleUrls: ['./global-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    TestDirective,
    IxIconComponent,
    MatButton,
    TranslateModule,
  ],
})
export class GlobalSearchResultsComponent implements OnChanges {
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

  constructor(
    protected authService: AuthService,
    private searchProvider: UiSearchProvider,
    private globalSearchSectionsProvider: GlobalSearchSectionsProvider,
    private router: Router,
    @Inject(WINDOW) private window: Window,
  ) {}

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
      if (!route.includes('*')) {
        this.router.navigate(route);
      } else if (!this.router.url.startsWith(route.slice(0, -1).join('/'))) {
        this.router.navigate(route.slice(0, -1));
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

  isSameHierarchyResult(a: UiSearchableElement, b: UiSearchableElement): boolean {
    return isEqual(a.hierarchy, b.hierarchy);
  }

  removeRecentSearch(event: Event, result: UiSearchableElement): void {
    event.stopPropagation();

    const existingResults = JSON.parse(this.window.localStorage.getItem('recentSearches') || '[]') as UiSearchableElement[];
    const updatedResults = existingResults.filter((item) => !isEqual(item.hierarchy, result.hierarchy));
    localStorage.setItem('recentSearches', JSON.stringify(updatedResults));
    this.recentSearchRemoved.emit();
  }

  private saveSearchResult(result: UiSearchableElement): void {
    const existingResults = JSON.parse(this.window.localStorage.getItem('recentSearches') || '[]') as UiSearchableElement[];
    const existingIndex = findIndex(existingResults, (item) => isEqual(item.hierarchy, result.hierarchy));

    if (existingIndex !== -1) existingResults.splice(existingIndex, 1);

    existingResults.unshift(result);

    localStorage.setItem('recentSearches', JSON.stringify(
      existingResults
        .slice(0, this.globalSearchSectionsProvider.recentSearchesMaximumToSave)
        .map((item) => ({ ...item, section: GlobalSearchSection.RecentSearches })),
    ));
  }
}
