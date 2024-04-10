import { Observable } from 'rxjs';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export interface GlobalSearchProvider {
  search(term: string, limit: number): Observable<UiSearchableElement[]>;
}
