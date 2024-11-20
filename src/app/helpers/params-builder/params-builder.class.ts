import { merge } from 'lodash-es';
import {
  OrQueryFilter,
  QueryFilter, QueryFilters, QueryOptions,
  QueryParams,
} from 'app/interfaces/query-api.interface';

export class ParamsBuilder<T, ExtraOptions = Record<string, unknown>> {
  private filters: QueryFilters<T> = [];
  options: QueryOptions<T> & ExtraOptions = {} as QueryOptions<T> & ExtraOptions;

  private wasLastConditionGroup = false;

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
    this.wasLastConditionGroup = false;
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
    this.wasLastConditionGroup = false;
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
    this.wasLastConditionGroup = false;
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
  group(groupBuilder: (group: ParamsBuilderGroup<T, ExtraOptions>) => void): this {
    const group = new ParamsBuilder<T, ExtraOptions>();
    groupBuilder(group);

    this.filters = group.getFilters();
    this.wasLastConditionGroup = true;

    return this;
  }

  andGroup(groupBuilder: (group: ParamsBuilderGroup<T, ExtraOptions>) => void): this {
    const group = new ParamsBuilder<T, ExtraOptions>();
    groupBuilder(group);
    this.andFilters(group.getFilters());
    this.wasLastConditionGroup = true;

    return this;
  }

  orGroup(groupBuilder: (group: ParamsBuilderGroup<T, ExtraOptions>) => void): this {
    const group = new ParamsBuilder<T, ExtraOptions>();
    groupBuilder(group);
    this.orFilters(group.getFilters());
    this.wasLastConditionGroup = true;

    return this;
  }

  /**
   * Options will be deep merged.
   * Filters will be appended via AND.
   */
  mergeWith(params: QueryParams<T, ExtraOptions>): this {
    if (params[0]) {
      // Treat previously added filters as a group.
      this.wasLastConditionGroup = true;
      this.andFilters(params[0]);
    }
    this.options = merge(this.options, params[1]);
    return this;
  }

  setOptions(options: QueryOptions<T> & ExtraOptions): this {
    this.options = options;
    return this;
  }

  private andFilters(toAdd: QueryFilters<T>): void {
    if (this.isTopConnectorOr() && !this.wasLastConditionGroup) {
      this.addToLastConditionInOrGroup(toAdd);
    } else {
      this.createNewAndGroup(toAdd);
    }
  }

  // TODO: This is relatively convoluted because of different processing for AND and OR groups.
  // TODO: AND groups do not use AND connector like OR groups and are flatter.
  // TODO: Consider refactoring to make code easier (or adding a separate optimization step in getFilters())
  private orFilters(toAdd: QueryFilters<T>): void {
    if (this.isTopConnectorOr() && !this.wasLastConditionGroup) {
      this.addConditionToOrGroup(toAdd);
    } else {
      this.createNewOrGroup(toAdd);
    }
  }

  private isTopConnectorOr(): boolean {
    return this.filters[0]?.[0] === 'OR';
  }

  private createNewOrGroup(toAdd: QueryFilters<T>): void {
    let topFilters = this.filters;
    if (topFilters.length > 1) {
      topFilters = [topFilters] as QueryFilters<T>;
    }
    this.filters = [['OR', [...topFilters, toAdd]] as OrQueryFilter<T>];
  }

  private addConditionToOrGroup(toAdd: QueryFilters<T>): void {
    (this.filters[0] as OrQueryFilter<T>)[1].push(toAdd);
  }

  private addToLastConditionInOrGroup(toAdd: QueryFilters<T>): void {
    const orGroup = this.filters[0][1] as QueryFilter<T>;
    const lastInOrGroup = orGroup[orGroup.length - 1] as QueryFilters<T>;
    const isAlreadyAndGroup = Array.isArray(lastInOrGroup[0]);
    if (isAlreadyAndGroup) {
      lastInOrGroup.push(...toAdd);
    } else {
      orGroup[orGroup.length - 1] = [lastInOrGroup, ...toAdd];
    }
  }

  private createNewAndGroup(toAdd: QueryFilters<T>): void {
    this.filters.push(...toAdd);
  }
}

export type ParamsBuilderGroup<T, ExtraOptions = Record<string, unknown>> = Pick<
  ParamsBuilder<T, ExtraOptions>,
  'filter' | 'andFilter' | 'orFilter' | 'group' | 'andGroup' | 'orGroup' | 'mergeWith' | 'getFilters'
>;
