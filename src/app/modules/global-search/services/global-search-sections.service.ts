import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import UiElementsJson from 'app/../assets/ui-searchable-elements.json';
import { Observable } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalSearchSectionsProvider {
  readonly recentSearchesMaximumToSave = 15;
  readonly globalSearchInitialLimit = 6;
  readonly globalSearchMaximumLimit = 25;

  searchSections = [
    { label: this.translate.instant('UI'), value: GlobalSearchSection.Ui },
    { label: this.translate.instant('Help'), value: GlobalSearchSection.Help },
    { label: this.translate.instant('Recent Searches'), value: GlobalSearchSection.RecentSearches },
  ];

  constructor(
    private translate: TranslateService,
    private searchProvider: UiSearchProvider,
    @Inject(WINDOW) private window: Window,
  ) {}

  getUiSectionResults(searchTerm: string): Observable<UiSearchableElement[]> {
    return this.searchProvider.search(searchTerm, this.globalSearchMaximumLimit);
  }

  getHelpSectionResults(searchTerm: string, appVersion: string): UiSearchableElement[] {
    return [
      {
        hierarchy: [this.translate.instant('Search Documentation for «{value}»', { value: searchTerm })],
        targetHref: `https://www.truenas.com/docs/scale/${appVersion}/search/?query=${searchTerm}`,
        section: GlobalSearchSection.Help,
      },
    ];
  }

  getRecentSearchesSectionResults(): UiSearchableElement[] {
    const recentSearches = JSON.parse(this.window.localStorage.getItem('recentSearches') || '[]') as UiSearchableElement[];
    const exitingHierarchies = new Set(UiElementsJson.map((item) => JSON.stringify(item.hierarchy)));

    const validRecentSearches = recentSearches.filter((item) => {
      return exitingHierarchies.has(JSON.stringify(item.hierarchy)) || item.hierarchy[0].startsWith('Search Documentation for');
    });

    if (recentSearches.length !== validRecentSearches.length) {
      this.window.localStorage.setItem('recentSearches', JSON.stringify(validRecentSearches));
    }

    return validRecentSearches;
  }
}
