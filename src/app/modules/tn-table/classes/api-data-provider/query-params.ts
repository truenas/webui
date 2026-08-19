import { QueryFilters, QueryOptions } from 'app/interfaces/query-api.interface';

export interface ApiQueryParams<T> {
  'query-filters'?: QueryFilters<T>;
  'query-options'?: QueryOptions<T>;
}
