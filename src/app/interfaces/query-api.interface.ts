/**
 * If you are typing query API, you probably just need this, i.e. QueryParams<User>
 * https://github.com/truenas/middleware/blob/master/src/middlewared/middlewared/apidocs/templates/websocket/query.md
 */
export type QueryParams<T, ExtraOptions = Record<string, unknown>> = [
  (QueryFilter<T>[] | ['OR', QueryFilter<T>[]])?,
  (QueryOptions<T> & ExtraOptions)?,
];

/**
 * TODO: First element is not a string, but a property path of T.
 * TODO: Once we upgrade to TS4.1, update with this:
 * TODO: https://www.reddit.com/r/typescript/comments/iywewf/ts41_is_there_a_way_to_define_this_property_path/
 * TODO: Potentially may be able to type unknown.
 */
// eslint-disable-next-line unused-imports/no-unused-vars
export type QueryFilter<T> = [string, QueryOperator, unknown];

export type QueryOptions<T> = {
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
  select?: (keyof T)[];

  /**
   * Specify which field determines the sort order.
   */
  order_by?: (keyof T | `-${Extract<keyof T, string>}`)[];
};

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
