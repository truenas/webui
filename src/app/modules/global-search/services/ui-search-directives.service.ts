import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UiSearchDirective } from 'app/directives/common/ui-search.directive';
import { getSearchableElementId } from 'app/modules/global-search/helpers/get-searchable-element-id';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

@Injectable({
  providedIn: 'root',
})
export class UiSearchDirectivesService {
  private directives = new Set<UiSearchDirective>();
  highlightOnDirectiveAdded$ = new BehaviorSubject<UiSearchDirective>(null);

  size(): number {
    return this.directives.size;
  }

  has(element: UiSearchableElement): boolean {
    return [...this.directives].some((directive) => directive.id === getSearchableElementId(element));
  }

  get(element: UiSearchableElement): UiSearchDirective {
    return [...this.directives.values()].find((directive) => {
      return directive.id === getSearchableElementId(element);
    });
  }

  register(directive: UiSearchDirective): void {
    this.directives.add(directive);
    this.highlightOnDirectiveAdded$.next(directive);
  }

  unregister(directive: UiSearchDirective): void {
    this.directives.delete(directive);
  }
}
