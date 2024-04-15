import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { UiSearchDirective } from 'app/directives/common/ui-search.directive';
import { getSearchableElementId } from 'app/modules/global-search/helpers/get-searchable-element-id';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

@Injectable({
  providedIn: 'root',
})
export class UiSearchDirectivesService {
  private directives = new Set<UiSearchDirective>();
  highlightOnDirectiveAdded$ = new Subject<void>();

  size(): number {
    return this.directives.size;
  }

  has(element: UiSearchableElement): boolean {
    const elementId = getSearchableElementId(element);
    for (const directive of this.directives.values()) {
      if (directive.id === elementId) {
        return true;
      }
    }
    return false;
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
    this.highlightOnDirectiveAdded$.next();
  }

  unregister(directive: UiSearchDirective): void {
    this.directives.delete(directive);
  }
}
