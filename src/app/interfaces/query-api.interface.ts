import { PropertyPath } from 'app/interfaces/property-path.type';

/**
 * If you are typing query API, you probably just need this, i.e. QueryParams<User>
 * https://github.com/truenas/middleware/blob/master/src/middlewared/middlewared/apidocs/templates/websocket/query.md
 */
export type QueryParams<T, ExtraOptions = Record<string, unknown>> = [
  QueryFilters<T>?,
  (QueryOptions<T> & ExtraOptions)?,
];

export type QueryFilters<T> = (QueryFilters<T> | QueryFilter<T> | OrQueryFilter<T>)[];

export type OrQueryFilter<T> = ['OR', QueryFilters<T>[]];

export type QueryFilter<T> = [PropertyPath<T>, QueryComparator, unknown];

export interface QueryOptions<T> {
  /**
   * Get the number of results returned.
   */
  count?: boolean;

  /**
   * Limit the number of results returned.
   */
  limit?: number;

  /**
   * Remove the first items from a returned list.
   */
  offset?: number;

  /**
   * Specify the exact fields to return.
   */
  select?: PropertyPath<T>[];

  /**
   * Specify which field determines the sort order.
   */
  order_by?: (PropertyPath<T> | `-${Extract<PropertyPath<T>, string>}`)[];
}

export type QueryComparator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | '~' // re.match(y, x)
  | 'in'
  | 'nin' // not in
  | 'rin' // x is not None and y in x
  | 'rnin' // x is not None and y not in x
  | '^' // x is not None and x.startswith(y)
  | '!^' // x is not None and not x.startswith(y)
  | '$' // x is not None and x.endswith(y)
  | '!$'; // x is not None and not x.endswith(y)
