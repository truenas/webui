import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import UiElementsJson from 'app/../assets/ui-searchable-elements.json';
import Fuse from 'fuse.js';
import {
  BehaviorSubject,
  Observable, combineLatest, filter, first, from, map, mergeMap, of, startWith, tap, toArray,
} from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { GlobalSearchProvider } from 'app/modules/global-search/interfaces/global-search-provider.interface';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { sortSearchResults } from 'app/modules/global-search/services/utils/sort-search-results';
import { EntitlementsService } from 'app/services/entitlements.service';
import { LicenseService } from 'app/services/license.service';

@Injectable({
  providedIn: 'root',
})
export class UiSearchProvider implements GlobalSearchProvider {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private license = inject(LicenseService);
  private entitlements = inject(EntitlementsService);

  uiElements = UiElementsJson as UiSearchableElement[];

  private selectedElement$ = new BehaviorSubject<UiSearchableElement | null>(null);
  selectionChanged$ = this.selectedElement$.asObservable().pipe(
    filter(Boolean),
    tap(() => this.selectedElement$.next(null)),
  );

  fuseSearch: Fuse<UiSearchableElement> = this.generateFuseSearch();

  constructor() {
    this.translate.onLangChange.subscribe(() => this.fuseSearch = this.generateFuseSearch());
  }

  search(term: string, limit: number): Observable<UiSearchableElement[]> {
    const fuzzySearchResults = this.fuseSearch.search(term).map((result) => result.item);
    const sortedResults = sortSearchResults(term, fuzzySearchResults).slice(0, limit);

    return from(sortedResults).pipe(
      mergeMap((item) => {
        return combineLatest([
          item.requiredRoles?.length ? this.authService.hasRole(item.requiredRoles) : of(true),
          this.license.hasFailover$,
          this.license.hasEnclosure$,
          this.visibleUnlessDenied(EntitlementFeature.Vms),
          this.visibleUnlessDenied(EntitlementFeature.Apps),
          this.visibleUnlessDenied(EntitlementFeature.Kmip),
          this.visibleUnlessDenied(EntitlementFeature.FibreChannel),
          this.visibleUnlessDenied(EntitlementFeature.Sed),
          this.license.hasSystemSecurity$,
        ]).pipe(
          first(),
          filter(([
            hasRole, hasFailover, hasEnclosure,
            hasVms, hasApps, hasKmip, hasFibreChannel, hasSed, hasSystemSecurity,
          ]) => {
            switch (true) {
              case !hasRole:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Failover) && !hasFailover:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Enclosure) && !hasEnclosure:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Vms) && !hasVms:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Apps) && !hasApps:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.FibreChannel) && !hasFibreChannel:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Kmip) && !hasKmip:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.Sed) && !hasSed:
              case item.visibleTokens?.includes(GlobalSearchVisibleToken.SystemSecurity) && !hasSystemSecurity:
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

  /**
   * `entitled$` withholds its answer until entitlements load, which here would withhold the whole
   * result set: `first()` never fires and the search returns nothing rather than an empty list.
   * Search is a lookup, not a gate, so an unknown entitlement reads as visible; the page the
   * result leads to still hides its own controls until the answer is real.
   */
  private visibleUnlessDenied(feature: EntitlementFeature): Observable<boolean> {
    return this.entitlements.entitled$(feature).pipe(startWith(true));
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
