import { Observable } from 'rxjs';
import { TableProvider } from 'app/modules/ix-table2/interfaces/table-provider.interface';

export class ArrayDataProvider<T> implements TableProvider<T> {
  currentPage;
  constructor(rows$: Observable<T[]>) {
    this.currentPage = rows$;
  }
}
