import { Option } from 'app/interfaces/option.interface';
import { EmptyConfig } from 'app/modules/entity/entity-empty/entity-empty.component';
import { AppTableConfig } from 'app/modules/entity/table/table.component';

export interface DataCard<T> {
  title: string;
  id: T;
  items?: Option[];
  tableConf?: AppTableConfig;

  // TODO: May be unused.
  actions?: (Option & { icon: string })[];
  emptyConf?: EmptyConfig;
}
