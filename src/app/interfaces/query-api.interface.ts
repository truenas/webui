export type QueryOperator =
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
   * TODO: Not string.
   */
  select?: (keyof T)[];

  /**
   * Specify which field determines the sort order.
   */
  order_by?: keyof T;
}

type QueryFilter<T> = [keyof T, QueryOperator, unknown];

type QueryParams<T> = ['OR', QueryFilter<T>[]];
