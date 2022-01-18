import { Observable } from 'rxjs';
import { Option } from '../../../../../interfaces/option.interface';

export interface IxCombobox2Provider {
  pageOffset: number;
  options$: Observable<Option[]>;
  filter: (options$: Observable<Option[]>, query: string) => void;
  onScrollEnd: (filterValue: string) => void;
}
