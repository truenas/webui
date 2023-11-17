import { merge } from 'lodash';
import {
  OrQueryFilter,
  QueryFilter, QueryFilters, QueryOptions,
  QueryParams,
} from 'app/interfaces/query-api.interface';

export class QueryBuilder<T, ExtraOptions = Record<string, unknown>> {
  private filters: QueryFilters<T> = [];
  options: QueryOptions<T> & ExtraOptions = {} as QueryOptions<T> & ExtraOptions;

  constructor(params: QueryParams<T, ExtraOptions> = []) {
    this.filters = params[0] || [];
    this.options = params[1] || {} as QueryOptions<T> & ExtraOptions;
  }

  getFilters(): QueryFilters<T> {
    return this.filters;
  }

  getOptions(): QueryOptions<T> & ExtraOptions {
    return this.options;
  }

  getParams(): QueryParams<T, ExtraOptions> {
    return [this.filters, this.options];
  }

  /**
   * Sets new filter replacing all previous filters.
   */
  filter(property: QueryFilter<T>[0], comparator: QueryFilter<T>[1], value: QueryFilter<T>[2]): this {
    this.filters = [[property, comparator, value]];
    return this;
  }

  /**
   * Adds a new filter via AND.
   *
   * ```
   * new QueryBuilder()
   *  .filter('username', '=', 'bob')
   *  .andFilter('age', '>', 40);
   *
   * is equivalent to:
   * username = 'bob' AND age > 40
   * ```
   */
  andFilter(property: QueryFilter<T>[0], comparator: QueryFilter<T>[1], value: QueryFilter<T>[2]): this {
    this.andFilters([[property, comparator, value]]);
    return this;
  }

  /**
   * Connects new filter to a previous one using an OR statement.
   *
   * ```
   * new QueryBuilder()
   *  .filter('username', '=', 'bob')
   *  .orFilter('username', '=', 'alice');
   *
   * is equivalent to:
   * username = 'bob' OR username = 'alice'
   * ```
   */
  orFilter(property: QueryFilter<T>[0], comparator: QueryFilter<T>[1], value: QueryFilter<T>[2]): this {
    this.orFilters([property, comparator, value] as QueryFilters<T>);

    return this;
  }

  /**
   * Starts a new group (similar to taking statements in brackets)
   *
   * ```
   * new QueryBuilder()
   *  .group((group) => {
   *    group
   *      .filter('username', '=', 'bob')
   *      .orFilter('username', '=', 'alice');
   *  })
   *  .andFilter('age', '>', 40);
   * ```
   * is equivalent to:
   * (username = 'bob' OR username = 'alice') AND age > 40
   */
  group(groupBuilder: (group: QueryBuilder<T,  ExtraOptions>) => void): this {
    const group = new QueryBuilder<T, ExtraOptions>();
    groupBuilder(group);

    this.filters = group.getFilters();

    return this;
  }

  andGroup(groupBuilder: (group: QueryBuilder<T,  ExtraOptions>) => void): this {
    const group = new QueryBuilder<T, ExtraOptions>();
    groupBuilder(group);

    this.andFilters(group.getFilters());
    return this;
  }

  orGroup(groupBuilder: (group: QueryBuilder<T,  ExtraOptions>) => void): this {
    const group = new QueryBuilder<T, ExtraOptions>();
    groupBuilder(group);

    this.orFilters(group.getFilters());

    return this;
  }

  /**
   * Options will be deep merged.
   * Filters will be appended via AND.
   */
  mergeWith(params: QueryParams<T, ExtraOptions>): this {
    this.options = merge(this.options, params[1]);
    this.andFilters(params[0]);
    return this;
  }

  setOptions(options: QueryOptions<T> & ExtraOptions): this {
    this.options = options;
    return this;
  }

  private andFilters(toAdd: QueryFilters<T>): void {
    if (this.isTopConnectorOr()) {
      const orGroup = this.filters[0][1] as QueryFilter<T>;
      const lastInOrGroup = orGroup[orGroup.length - 1] as QueryFilter<T>;
      orGroup[orGroup.length - 1] = [lastInOrGroup, ...toAdd];
    } else {
      this.filters.push(...toAdd);
    }
  }

  private orFilters(toAdd: QueryFilters<T>): void {
    if (this.isTopConnectorOr()) {
      // TODO: Update typings for QueryFilter to allow for nesting.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.filters[0] as OrQueryFilter<T>)[1].push(toAdd as any);
    } else {
      const currentFilters = this.filters as QueryFilter<T>;
      this.filters = [['OR', [...currentFilters, toAdd]] as OrQueryFilter<T>];
    }
  }

  private isTopConnectorOr(): boolean {
    return this.filters[0]?.[0] === 'OR';
  }
}
