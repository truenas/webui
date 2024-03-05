import { Injectable } from '@angular/core';
import UiElementsJson from 'app/../assets/ui-searchable-elements.json';
import {
  Observable, filter, from, map, mergeMap, of, take, toArray,
} from 'rxjs';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';
import { UiSearchProvider } from 'app/modules/global-ui-search/interfaces/ui-search-provider.interface';
import { AuthService } from 'app/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UiSearchProviderService implements UiSearchProvider {
  private readonly uiElements = UiElementsJson as UiSearchableElement[];

  constructor(private authService: AuthService) {}

  search(term: string): Observable<UiSearchableElement[]> {
    if (!term?.trim()) {
      return of([]);
    }

    const lowercaseTerm = term.toLowerCase();

    const results = this.uiElements.filter((item) => {
      return item.hierarchy.join(' ').toLowerCase().includes(lowercaseTerm)
        || item.synonyms.join(' ').toLowerCase().includes(lowercaseTerm);
    });

    return from(results).pipe(
      mergeMap((item) => {
        if (!item.requiredRoles.length) {
          return of(item);
        }

        return this.authService.hasRole(item.requiredRoles).pipe(
          filter((hasRole) => hasRole),
          map(() => item),
          take(1),
        );
      }),
      toArray(),
    );
  }
}
