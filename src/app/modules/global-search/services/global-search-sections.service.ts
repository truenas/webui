import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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

  getHelpSectionResults(searchTerm: string): UiSearchableElement[] {
    return [
      {
        hierarchy: [this.translate.instant('Search Documentation for «{value}»', { value: searchTerm })],
        targetHref: `https://www.truenas.com/docs/search/?query=${searchTerm}`,
        section: GlobalSearchSection.Help,
      },
    ];
  }

  getRecentSearchesSectionResults(): UiSearchableElement[] {
    return JSON.parse(this.window.localStorage.getItem('recentSearches') || '[]');
  }
}
