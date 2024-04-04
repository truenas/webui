import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import UiElementsJson from 'app/../assets/ui-searchable-elements.json';
import {
  BehaviorSubject,
  Observable, combineLatestWith, delay, distinctUntilChanged, filter, first, from, map, mergeMap, of, tap, toArray,
} from 'rxjs';
import { UiSearchableElementDirective } from 'app/directives/common/ui-searchable-element.directive';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
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

  registeredDirectives = new Map<string, UiSearchableElementDirective>();
  private selectedElement$ = new BehaviorSubject<UiSearchableElement>(null);
  private highlightOnDirectiveAdded$ = new BehaviorSubject<UiSearchableElementDirective>(null);

  selectionChanged$ = this.selectedElement$.asObservable().pipe(
    filter(Boolean),
    distinctUntilChanged(),
    tap(() => this.selectedElement$.next(null)),
  );

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.listenForDirectivesToHighlight();
  }

  search(term: string): Observable<UiSearchableElement[]> {
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
    }).slice(0, 50);

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

  select(element: UiSearchableElement): void {
    this.selectedElement$.next(element);
  }

  register(config: UiSearchableElement, directive: UiSearchableElementDirective): void {
    this.registeredDirectives.set(config.anchor, directive);
    this.highlightOnDirectiveAdded$.next(directive);
  }

  unregister(config: UiSearchableElement): void {
    this.registeredDirectives.delete(config.anchor);
  }

  private listenForDirectivesToHighlight(): void {
    this.selectionChanged$.pipe(
      combineLatestWith(this.highlightOnDirectiveAdded$),
      tap(([selectedElement, directive]) => console.info('highlightOnDirectiveAdded', directive, selectedElement)),
      filter(([selectedElement]) => this.registeredDirectives.has(selectedElement.anchor)),
      delay(searchDelayConst),
    ).subscribe(([element]) => {
      this.document.querySelector<HTMLElement>('.ix-slide-in-background.open')?.click();
      this.document.querySelector<HTMLElement>('.ix-slide-in2-background.open')?.click();
      this.registeredDirectives.get(element.anchor).highlight();
    });
  }
}
