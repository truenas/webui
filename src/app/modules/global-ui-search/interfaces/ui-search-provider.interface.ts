import { Observable } from 'rxjs';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';

export interface UiSearchProvider {
  search(term: string): Observable<UiSearchableElement[]>;
}
