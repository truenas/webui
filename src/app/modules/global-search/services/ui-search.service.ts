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

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
  ) {}

  search(term: string): Observable<UiSearchableElement[]> {
    const lowercaseTerm = term.toLowerCase();

    const translatedTerms = this.uiElements?.map((element) => {
      return {
        ...element,
        hierarchy: element.hierarchy.map((key) => this.translate.instant(key)),
        synonyms: element.synonyms.map((key) => this.translate.instant(key)),
      };
    });

    const results = translatedTerms.filter((item) => {
      if (!term?.trim()) {
        return true;
      }

      return item.hierarchy[item.hierarchy.length - 1]?.toLowerCase()?.startsWith(lowercaseTerm);
    }).splice(0, 50);

    return from(results).pipe(
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
