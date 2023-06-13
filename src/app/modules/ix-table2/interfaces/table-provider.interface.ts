import { Observable } from 'rxjs';

export interface TableProvider<T> {
  currentPage: Observable<T[]>;
}
