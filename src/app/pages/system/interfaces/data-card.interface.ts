import { Option } from 'app/interfaces/option.interface';
import { AppTableConfig } from 'app/pages/common/entity/table/table.component';

export interface DataCard {
  title: string;
  id: string;
  items?: Option[];
  tableConf?: AppTableConfig;

  // TODO: May be unused.
  actions?: (Option & { icon: string })[];
}
