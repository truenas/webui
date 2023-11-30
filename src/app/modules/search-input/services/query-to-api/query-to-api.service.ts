import { Injectable } from '@angular/core';
import { ParamsBuilder, ParamsBuilderGroup } from 'app/helpers/params-builder/params-builder.class';
import { QueryFilter, QueryFilters } from 'app/interfaces/query-api.interface';
import {
  Condition, ConditionGroup, ConnectorType, isConditionGroup,
  QueryParsingResult,
} from 'app/modules/search-input/services/query-parser/query-parsing-result.interface';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

@Injectable()
export class QueryToApiService<T> {
  private builder: ParamsBuilder<T>;
  private searchProperties: SearchProperty<T>[];

  buildFilters(query: QueryParsingResult, properties: SearchProperty<T>[]): QueryFilters<T> {
    this.searchProperties = properties;
    this.builder = new ParamsBuilder<T>();
    this.addNode(this.builder, query.tree);

    return this.builder.getFilters();
  }

  private addNode(paramsGroup: ParamsBuilderGroup<T>, node: Condition | ConditionGroup): void {
    if (isConditionGroup(node)) {
      this.buildGroup(paramsGroup, node);
      return;
    }

    paramsGroup.filter(...this.buildCondition(node));
  }

  private buildGroup(paramsGroup: ParamsBuilderGroup<T>, conditionGroup: ConditionGroup): void {
    // Left
    if (isConditionGroup(conditionGroup.left)) {
      paramsGroup.group((leftGroup) => {
        this.buildGroup(leftGroup, conditionGroup.left as ConditionGroup);
      });
    } else {
      paramsGroup.filter(...this.buildCondition(conditionGroup.left));
    }

    // Right OR
    if (conditionGroup.connector === ConnectorType.Or) {
      if (isConditionGroup(conditionGroup.right)) {
        paramsGroup.orGroup((rightGroup) => {
          this.buildGroup(rightGroup, conditionGroup.right as ConditionGroup);
        });
      } else {
        paramsGroup.orFilter(...this.buildCondition(conditionGroup.right));
      }
    } else {
      // Right AND
      // eslint-disable-next-line no-lonely-if
      if (isConditionGroup(conditionGroup.right)) {
        paramsGroup.andGroup((rightGroup) => {
          this.buildGroup(rightGroup, conditionGroup.right as ConditionGroup);
        });
      } else {
        paramsGroup.andFilter(...this.buildCondition(conditionGroup.right));
      }
    }
  }

  private buildCondition(condition: Condition): QueryFilter<T> {
    // TODO: This should 1) map column name 2) transform column value if necessary
    // TODO: See searchProperties
    return [condition.property, condition.comparator, condition.value] as QueryFilter<T>;
  }
}
