import { EmptyType } from 'app/enums/empty-type.enum';
import { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';

export class ArrayDataProvider<T> extends BaseDataProvider<T> {
  setEmptyType(type: EmptyType | null): void {
    this.emptyType$.next(type);
  }
}
