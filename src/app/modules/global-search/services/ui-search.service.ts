import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import UiElementsJson from 'app/../assets/ui-searchable-elements.json';
import {
  Observable, filter, first, from, map, mergeMap, of, toArray,
} from 'rxjs';
import { GlobalSearchProvider } from 'app/modules/global-search/interfaces/global-search-provider.interface';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { AuthService } from 'app/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UiSearchProvider implements GlobalSearchProvider {
  uiElements = UiElementsJson as UiSearchableElement[];

  private translatedTerms = this.uiElements?.map((element) => {
    return {
      ...element,
      hierarchy: element.hierarchy.map((key) => this.translate.instant(key)),
      synonyms: element.synonyms.map((key) => this.translate.instant(key)),
    };
  });

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
  ) {}

  search(term: string, limit: number): Observable<UiSearchableElement[]> {
    // sort results by showing hierarchy match first, then synonyms match
    const sortedResults = this.translatedTerms.filter((item) => {
      return item.synonyms.find((synonym) => synonym?.toLowerCase().startsWith(term.toLowerCase()))
        || item.hierarchy[item.hierarchy.length - 1]?.toLowerCase().startsWith(term.toLowerCase());
    }).sort((a, b) => {
      const aHierarchyMatch = a.hierarchy[a.hierarchy.length - 1]?.toLowerCase().startsWith(term.toLowerCase()) ? 1 : 0;
      const bHierarchyMatch = b.hierarchy[b.hierarchy.length - 1]?.toLowerCase().startsWith(term.toLowerCase()) ? 1 : 0;

      const aSynonymMatch = a.synonyms.find((synonym) => synonym?.toLowerCase().startsWith(term.toLowerCase())) ? 1 : 0;
      const bSynonymMatch = b.synonyms.find((synonym) => synonym?.toLowerCase().startsWith(term.toLowerCase())) ? 1 : 0;

      return bHierarchyMatch - aHierarchyMatch || aSynonymMatch - bSynonymMatch;
    }).slice(0, limit);

    return from(sortedResults).pipe(
      mergeMap((item) => {
        if (!item.requiredRoles.length) {
          return of(item);
        }

        return this.authService.hasRole(item.requiredRoles).pipe(
          first(),
          filter((hasRole) => hasRole),
          map(() => item),
        );
      }),
      toArray(),
    );
  }
}
