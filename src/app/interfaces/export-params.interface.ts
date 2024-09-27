import { ExportFormat } from 'app/enums/export-format.enum';
import { QueryFilters, QueryOptions } from 'app/interfaces/query-api.interface';

export interface ExportParams<T, F = ExportFormat> {
  'query-filters'?: QueryFilters<T>;
  'query-options'?: QueryOptions<T>;
  export_format?: F;
  remote_controller?: boolean;
}
