import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import UiElementsJson from 'app/../assets/ui-searchable-elements.json';
import Fuse from 'fuse.js';
import {
  BehaviorSubject,
  Observable, filter, first, from, map, mergeMap, of, tap, toArray,
} from 'rxjs';
import { GlobalSearchProvider } from 'app/modules/global-search/interfaces/global-search-provider.interface';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { AuthService } from 'app/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UiSearchProvider implements GlobalSearchProvider {
  uiElements = UiElementsJson as UiSearchableElement[];

  private translatedTerms = this.uiElements.map((element) => {
    return {
      ...element,
      hierarchy: (element.hierarchy || []).map((key) => this.translate.instant(key)),
      synonyms: (element.synonyms || []).map((key) => this.translate.instant(key)),
    };
  });

  private fuse = new Fuse(this.translatedTerms, {
    keys: ['hierarchy', 'synonyms'],
    threshold: 0.15,
  });

  private selectedElement$ = new BehaviorSubject<UiSearchableElement>(null);
  selectionChanged$ = this.selectedElement$.asObservable().pipe(
    filter(Boolean),
    tap(() => this.selectedElement$.next(null)),
  );

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
  ) {
  }

  search(term: string, limit: number): Observable<UiSearchableElement[]> {
    // sort results by showing hierarchy match first, then synonyms match
    const fuzzySearchResults = this.fuse.search(term)
      .map((result) => result.item)
      .sort((a, b) => {
        const aHierarchyMatch = a.hierarchy[a.hierarchy.length - 1]?.toLowerCase().includes(term.toLowerCase()) ? 1 : 0;
        const bHierarchyMatch = b.hierarchy[b.hierarchy.length - 1]?.toLowerCase().includes(term.toLowerCase()) ? 1 : 0;

        const aSynonymMatch = a.synonyms.find((synonym) => synonym?.toLowerCase().includes(term.toLowerCase())) ? 1 : 0;
        const bSynonymMatch = b.synonyms.find((synonym) => synonym?.toLowerCase().includes(term.toLowerCase())) ? 1 : 0;

        return bHierarchyMatch - aHierarchyMatch || aSynonymMatch - bSynonymMatch;
      })
      .slice(0, limit);

    return from(fuzzySearchResults).pipe(
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

  select(element: UiSearchableElement): void {
    this.selectedElement$.next(element);
  }
}
