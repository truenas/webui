import { PropertyPath } from 'app/interfaces/property-path.type';

/**
 * If you are typing query API, you probably just need this, i.e. QueryParams<User>
 * https://github.com/truenas/middleware/blob/master/src/middlewared/middlewared/apidocs/templates/websocket/query.md
 */
export type QueryParams<T, ExtraOptions = Record<string, unknown>> = [
  QueryFilters<T>?,
  (QueryOptions<T> & ExtraOptions)?,
];

export interface FilterPreset<T> {
  label: string;
  query: QueryFilters<T>;
}

export interface FilterPresetChanged<T> {
  filters: QueryFilters<T>[];
  selectedLabels: Set<string>;
}

export type QueryFilters<T> = (QueryFilters<T> | QueryFilter<T> | OrQueryFilter<T>)[];

export type OrQueryFilter<T> = ['OR', QueryFilters<T>[]];

export type QueryFilter<T> = [PropertyPath<T>, QueryComparator, unknown];

export interface QueryOptions<T> {
  /**
   * Get the number of results returned.
   */
  count?: boolean;

  /**
   * Get a single object instead of an array. Returns the first match or throws an error if not found.
   * Has the advantage of inserting into the directory services cache on positive result.
   *
   * IMPORTANT: When get: true, the return type changes from T[] to T.
   * The type cast `as unknown as Observable<T>` is required because TypeScript's
   * type system doesn't currently support conditional return types based on option values.
   *
   * Future improvement: Consider adding method overloads to ApiService to eliminate
   * the need for type casting:
   * ```typescript
   * call<T>(method: string, params: [QueryFilter<T>[], { get: true }]): Observable<T>;
   * call<T>(method: string, params: [QueryFilter<T>[], QueryOptions<T>?]): Observable<T[]>;
   * ```
   *
   * @example
   * ```typescript
   * // Returns Observable<User> instead of Observable<User[]>
   * return this.api.call('user.query', [filters, { get: true }]) as unknown as Observable<User>;
   * ```
   */
  get?: boolean;

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

export type QueryComparator
  = | '='
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
