import { QueryFilters } from 'app/interfaces/query-api.interface';

export type SearchQuery<T> =
  | BasicSearchQuery
  | AdvancedSearchQuery<T>;

export interface BasicSearchQuery {
  isBasicQuery: true;
  query: string;
}

export interface AdvancedSearchQuery<T> {
  isBasicQuery: false;
  filters: QueryFilters<T>;
}
