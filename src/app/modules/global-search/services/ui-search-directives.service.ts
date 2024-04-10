import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UiSearchDirective } from 'app/directives/common/ui-search.directive';

@Injectable({
  providedIn: 'root',
})
export class UiSearchDirectivesService {
  private directives = new Set<UiSearchDirective>();
  highlightOnDirectiveAdded$ = new BehaviorSubject<UiSearchDirective>(null);

  size(): number {
    return this.directives.size;
  }

  has(anchor: string): boolean {
    return [...this.directives].some((directive) => directive.id === anchor);
  }

  get(anchor: string): UiSearchDirective {
    return [...this.directives].find((directive) => directive.id === anchor);
  }

  register(directive: UiSearchDirective): void {
    this.directives.add(directive);
    this.highlightOnDirectiveAdded$.next(directive);
  }

  unregister(directive: UiSearchDirective): void {
    this.directives.delete(directive);
  }
}
