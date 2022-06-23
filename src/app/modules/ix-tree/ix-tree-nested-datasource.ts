import { MatTreeNestedDataSource } from '@angular/material/tree';
import { IxFilter } from 'app/modules/ix-filters/ix-filters.interface';

export class IxNestedTreeDataSource<T> extends MatTreeNestedDataSource<T> {
  search(query: string): void {
    console.info('do search manipulations, query:', query);
  }

  filter(filters: IxFilter[]): void {
    console.info('do filter manipulations, filters:', filters);
  }
}
