import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import UiElementsJson from 'app/../assets/ui-searchable-elements.json';
import Fuse from 'fuse.js';
import {
  BehaviorSubject,
  Observable, combineLatest, filter, first, from, map, mergeMap, of, tap, toArray,
} from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { GlobalSearchProvider } from 'app/modules/global-search/interfaces/global-search-provider.interface';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { sortSearchResults } from 'app/modules/global-search/services/utils/sort-search-results';
import { NavigationService } from 'app/services/navigation/navigation.service';

@Injectable({
  providedIn: 'root',
})
export class UiSearchProvider implements GlobalSearchProvider {
  uiElements = UiElementsJson as UiSearchableElement[];

  private selectedElement$ = new BehaviorSubject<UiSearchableElement | null>(null);
  selectionChanged$ = this.selectedElement$.asObservable().pipe(
    filter(Boolean),
    tap(() => this.selectedElement$.next(null)),
  );

  fuseSearch: Fuse<UiSearchableElement> = this.generateFuseSearch();

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private navService: NavigationService,
  ) {
    this.translate.onLangChange.subscribe(() => this.fuseSearch = this.generateFuseSearch());
  }

  search(term: string, limit: number): Observable<UiSearchableElement[]> {
    const fuzzySearchResults = this.fuseSearch.search(term).map((result) => result.item);
    const sortedResults = sortSearchResults(term, fuzzySearchResults).slice(0, limit);

    return from(sortedResults).pipe(
      mergeMap((item) => {
        return combineLatest([
          item.requiredRoles.length ? this.authService.hasRole(item.requiredRoles) : of(true),
          this.navService.hasFailover$,
          this.navService.hasEnclosure$,
          this.navService.hasVms$,
          this.navService.hasApps$,
        ]).pipe(
          first(),
          filter(([hasRole, hasFailover, hasEnclosure, hasVms, hasApps]) => {
            switch (true) {
              case !hasRole:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Failover) && !hasFailover:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Enclosure) && !hasEnclosure:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Vms) && !hasVms:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Apps) && !hasApps:
                return false;
              default:
                return true;
            }
          }),
          map(() => item),
        );
      }),
      toArray(),
    );
  }

  select(element: UiSearchableElement): void {
    this.selectedElement$.next(element);
  }

  private generateFuseSearch(): Fuse<UiSearchableElement> {
    const terms = this.uiElements.map((element) => {
      return {
        ...element,
        hierarchy: (element.hierarchy || []).map((key) => this.translate.instant(key)),
        synonyms: (element.synonyms || []).map((key) => this.translate.instant(key)),
      };
    });

    return new Fuse(terms, {
      keys: ['hierarchy', 'synonyms'],
      threshold: 0.15,
    });
  }
}
