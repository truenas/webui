import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { parseISO, startOfDay } from 'date-fns';
import { ParamsBuilder, ParamsBuilderGroup } from 'app/helpers/params-builder/params-builder.class';
import { QueryFilter, QueryFilters } from 'app/interfaces/query-api.interface';
import {
  Condition, ConditionGroup, ConnectorType, isConditionGroup,
  LiteralValue,
  QueryParsingResult,
} from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';
import { PropertyType, SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';

@Injectable({
  providedIn: 'root',
})
export class QueryToApiService<T> {
  private builder: ParamsBuilder<T>;
  private searchProperties: SearchProperty<T>[];

  constructor(private translate: TranslateService) {}

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

    if (node) {
      paramsGroup.filter(...this.buildCondition(node));
    }
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
      // eslint-disable-next-line sonarjs/no-lonely-if
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
    const currentProperty = this.searchProperties.find((value) => {
      return value.label?.toLowerCase() === condition.property?.toLowerCase();
    });
    const mappedConditionProperty = currentProperty?.property || condition.property;
    const mappedConditionValue = this.mapValueByPropertyType(currentProperty, condition.value);

    return [mappedConditionProperty, condition.comparator.toLowerCase(), mappedConditionValue] as QueryFilter<T>;
  }

  private mapValueByPropertyType(
    property: SearchProperty<T>,
    value: LiteralValue | LiteralValue[],
  ): LiteralValue | LiteralValue[] {
    if (property?.propertyType === PropertyType.Date) {
      return this.parseDateAsUnixSeconds(value);
    }

    if (property?.propertyType === PropertyType.Memory) {
      return this.parseMemoryValue(property, value);
    }

    if (property?.propertyType === PropertyType.Text && property.enumMap) {
      return this.parseTextValue(property, value);
    }

    return value;
  }

  private parseDateAsUnixSeconds(value: LiteralValue | LiteralValue[]): number | number[] {
    const convertDate = (dateValue: LiteralValue): number | null => {
      const date = parseISO(dateValue as string);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return startOfDay(date).getTime() / 1000;
    };

    if (Array.isArray(value)) {
      return value.map(convertDate);
    }

    return convertDate(value);
  }

  private parseMemoryValue(
    property: SearchProperty<T>,
    value: LiteralValue | LiteralValue[],
  ): number | number[] {
    const parseValue = (memoryValue: LiteralValue): number => {
      return property.parseValue(memoryValue as string) as number;
    };

    if (Array.isArray(value)) {
      return value.map(parseValue);
    }

    return parseValue(value);
  }

  private parseTextValue(
    property: SearchProperty<T>,
    value: LiteralValue | LiteralValue[],
  ): string | string[] {
    const parseValue = (textValue: LiteralValue): string => {
      return [...property.enumMap.keys() as unknown as string[]].find(
        (key) => this.translate.instant(property.enumMap.get(key)).toLowerCase() === textValue.toString().toLowerCase(),
      ) || textValue as string;
    };

    if (Array.isArray(value)) {
      return value.map(parseValue);
    }

    return parseValue(value);
  }
}
