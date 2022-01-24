import { Subject } from 'rxjs';
import { Option } from '../../../../../interfaces/option.interface';

export interface IxCombobox2Provider {
  pageOffset: number;
  providerUpdater$: Subject<void>;
  options: Option[];
  filter: (query: string) => void;
  onScrollEnd: (filterValue: string) => void;
  isLoading: boolean;
}
