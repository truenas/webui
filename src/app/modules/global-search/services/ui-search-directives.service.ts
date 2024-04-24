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
  directiveAdded$ = new BehaviorSubject<UiSearchDirective>(null);

  size(): number {
    return this.directives.size;
  }

  get(element: UiSearchableElement): UiSearchDirective {
    const elementId = getSearchableElementId(element);
    for (const directive of this.directives.values()) {
      if (directive.id === elementId) {
        return directive;
      }
    }
    return null;
  }

  register(directive: UiSearchDirective): void {
    this.directives.add(directive);
    this.directiveAdded$.next(directive);
  }

  unregister(directive: UiSearchDirective): void {
    this.directives.delete(directive);
  }
}
