import { Subject } from 'rxjs';
import { Option } from '../../../../../interfaces/option.interface';

export interface IxCombobox2Provider {
  providerUpdater$: Subject<void>;
  options: Option[];
  filter: (query: string) => void;
  nextPage: (filterValue: string) => void;
  isLoading: boolean;
}
