import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Inject, Input, OnChanges, TrackByFunction,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { findIndex, isEqual } from 'lodash';
import {
  combineLatestWith, filter, delay,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { processHierarchy } from 'app/modules/global-search/helpers/process-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-search-results',
  templateUrl: './global-search-results.component.html',
  styleUrls: ['./global-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchResultsComponent implements OnChanges {
  @Input() searchTerm = '';
  @Input() isLoading = false;
  @Input() results: UiSearchableElement[] = [];

  readonly resultLimit = 6;
  readonly initialResultsLimit = this.globalSearchSectionsProvider.globalSearchInitialLimit;
  readonly trackBySection: TrackByFunction<Option<GlobalSearchSection>> = (_, section) => section.value;
  readonly trackById: TrackByFunction<UiSearchableElement> = (_, item) => generateIdFromHierarchy(item.hierarchy);

  processHierarchy = processHierarchy;

  initialShowAll: Record<GlobalSearchSection, boolean> = Object.fromEntries(
    Object.values(GlobalSearchSection).map((section) => [section, false]),
  ) as Record<GlobalSearchSection, boolean>;

  showAll = { ...this.initialShowAll };

  get availableSections(): Option<GlobalSearchSection>[] {
    const uniqueSectionValues = new Set(this.results.map((result) => result.section));

    if (
      this.searchTerm
      && !uniqueSectionValues.has(GlobalSearchSection.Ui)
      && !uniqueSectionValues.has(GlobalSearchSection.RecentSearches)
    ) {
      uniqueSectionValues.add(GlobalSearchSection.Ui);
    }

    return this.globalSearchSectionsProvider.searchSections.filter(
      (sectionOption) => uniqueSectionValues.has(sectionOption.value),
    );
  }

  constructor(
    protected authService: AuthService,
    private searchProvider: UiSearchProvider,
    private searchDirectives: UiSearchDirectivesService,
    private globalSearchSectionsProvider: GlobalSearchSectionsProvider,
    private router: Router,
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.listenForSelectionChanges();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.searchTerm) {
      this.showAll = { ...this.initialShowAll };
    }
  }

  selectElement(element: UiSearchableElement): void {
    this.searchProvider.select(element);
    this.saveSearchResult(element);
    const route = element.anchorRouterLink || element.routerLink;
    if (element.targetHref) {
      this.window.open(element.targetHref, '_blank');
    }
    if (route?.length) {
      this.router.navigate(route);
    }
  }

  toggleShowAll(section: GlobalSearchSection): void {
    this.showAll[section] = !this.showAll[section];
  }

  getLimitedSectionResults(section: GlobalSearchSection): UiSearchableElement[] {
    const sectionResults = this.results.filter((element) => element.section === section);

    if (this.showAll[section] || sectionResults.length <= this.initialResultsLimit) {
      return sectionResults;
    }

    return sectionResults.slice(0, this.initialResultsLimit);
  }

  getElementsBySection(section: GlobalSearchSection): UiSearchableElement[] {
    return this.results.filter((element) => element?.section === section);
  }

  listenForSelectionChanges(): void {
    this.searchProvider.selectionChanged$.pipe(
      combineLatestWith(this.searchDirectives.highlightOnDirectiveAdded$),
      filter(([selectedElement]) => this.searchDirectives.has(selectedElement.anchor)),
      delay(searchDelayConst),
      untilDestroyed(this),
    ).subscribe(([element]) => {
      this.document.querySelector<HTMLElement>('.ix-slide-in-background.open')?.click();
      this.document.querySelector<HTMLElement>('.ix-slide-in2-background.open')?.click();
      this.searchDirectives.get(element.anchor).highlight();
    });
  }

  private saveSearchResult(result: UiSearchableElement): void {
    const existingResults = JSON.parse(
      this.window.localStorage.getItem('recentSearches') || '[]',
    ) as UiSearchableElement[];

    const existingIndex = findIndex(existingResults, (item) => isEqual(item.hierarchy, result.hierarchy));

    if (existingIndex !== -1) {
      existingResults.splice(existingIndex, 1);
    }

    existingResults.unshift(result);

    localStorage.setItem('recentSearches', JSON.stringify(
      existingResults
        .slice(0, this.globalSearchSectionsProvider.recentSearchesMaximumToSave)
        .map((item) => ({ ...item, section: GlobalSearchSection.RecentSearches })),
    ));
  }
}
