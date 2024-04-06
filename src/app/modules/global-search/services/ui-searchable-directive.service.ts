import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UiSearchableElementDirective } from 'app/directives/common/ui-searchable-element.directive';

@Injectable({
  providedIn: 'root',
})
export class UiSearchableDirectiveService {
  registeredDirectives = new Map<string, UiSearchableElementDirective>();
  highlightOnDirectiveAdded$ = new BehaviorSubject<UiSearchableElementDirective>(null);

  register(directive: UiSearchableElementDirective): void {
    this.registeredDirectives.set(directive.ixSearchConfig.anchor, directive);
    this.highlightOnDirectiveAdded$.next(directive);
  }

  unregister(directive: UiSearchableElementDirective): void {
    this.registeredDirectives.delete(directive.ixSearchConfig.anchor);
  }
}
