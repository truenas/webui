import { Injectable } from '@angular/core';
import { SyntaxNode, TreeCursor } from '@lezer/common';
import { TranslateService } from '@ngx-translate/core';
import { format, fromUnixTime } from 'date-fns';
import {
  OrQueryFilter, QueryComparator, QueryFilter, QueryFilters,
} from 'app/interfaces/query-api.interface';
import { parser } from 'app/modules/forms/search-input/services/query-parser/query-grammar';
import {
  Condition,
  ConditionGroup, ConnectorType, LiteralValue, ParsedToken,
  QueryParsingError,
  QueryParsingResult, QuerySyntaxError,
} from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';
import { PropertyType, SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';

@Injectable({
  providedIn: 'root',
})
export class QueryParserService<T> {
  private input: string;

  constructor(private translate: TranslateService) {}

  extractTokens(query: string): string[] {
    const tree = parser.parse(query);
    const cursor = tree.cursor();
    const tokens: { type: ParsedToken; text: string }[] = [];

    const explore = (nextCursor: TreeCursor): void => {
      do {
        const nodeType = nextCursor.node.type.name as ParsedToken;
        tokens.push({
          type: nodeType,
          text: query.slice(nextCursor.from, nextCursor.to),
        });
        if (nextCursor.firstChild()) {
          explore(nextCursor);
          nextCursor.parent();
        }
      } while (nextCursor.nextSibling());
    };

    explore(cursor);

    return this.filterAndMapTokens(tokens);
  }

  parseQuery(input: string): QueryParsingResult {
    this.input = input;
    const tree = parser.parse(input);
    const errors = this.getSyntaxErrors(tree.topNode);
    if (errors.length) {
      return {
        hasErrors: true,
        errors,
        tree: null,
      };
    }

    try {
      const parsedTree = this.parseNode(tree.topNode.firstChild);
      return {
        hasErrors: false,
        errors: [],
        tree: parsedTree,
      };
    } catch (error: unknown) {
      console.error(error);
      return {
        hasErrors: true,
        errors: [error as QueryParsingError],
        tree: null,
      };
    }
  }

  formatFiltersToQuery(structure: QueryFilters<T>, properties: SearchProperty<T>[]): string {
    return structure.map((element) => this.parseElementFromQueryFilter(element, properties)).join(' AND ');
  }

  private getSyntaxErrors(startingNode: SyntaxNode): QuerySyntaxError[] {
    const errors: QuerySyntaxError[] = [];
    startingNode.cursor().iterate((node) => {
      if ((node.name as ParsedToken) !== ParsedToken.Error) {
        return;
      }

      errors.push(new QuerySyntaxError(node.from, node.to));
    });

    return errors;
  }

  private parseNode(node: SyntaxNode): ConditionGroup | Condition {
    const name = node.name as ParsedToken;
    if (name === ParsedToken.ConditionGroup) {
      return this.parseConditionGroup(node);
    }
    if (name === ParsedToken.Condition) {
      return this.parseCondition(node);
    }

    throw new Error(`Unexpected node: ${node.name}`);
  }

  private parseConditionGroup(node: SyntaxNode): ConditionGroup {
    const left = this.parseNode(node.firstChild);
    const connector = this.parseConnector(node.getChild(ParsedToken.And) || node.getChild(ParsedToken.Or));
    const right = this.parseNode(node.lastChild);

    return {
      left,
      connector,
      right,
    };
  }

  private parseCondition(node: SyntaxNode): Condition {
    const property = this.parseLiteral(node.getChild(ParsedToken.Property).firstChild);

    const comparatorNode = node.getChild(ParsedToken.Comparator);
    const comparator = this.getNodeText(comparatorNode).toLowerCase() as QueryComparator;

    const value = this.parseLiteral(node.getChild(ParsedToken.Value).firstChild);

    return {
      comparator,
      value,
      property: property as string,
    };
  }

  private parseConnector(node: SyntaxNode): ConnectorType {
    return (node.name as ParsedToken) === ParsedToken.Or ? ConnectorType.Or : ConnectorType.And;
  }

  private parseLiteral(node: SyntaxNode): LiteralValue | LiteralValue[] {
    const token = node.name as ParsedToken;
    switch (token) {
      case ParsedToken.DoubleQuotedString:
        return JSON.parse(this.getNodeText(node));
      case ParsedToken.Boolean:
      case ParsedToken.Number:
      case ParsedToken.Null:
        return JSON.parse(this.getNodeText(node).toLowerCase());
      case ParsedToken.SingleQuotedString: {
        // JSON parse doesn't understand single quoted strings.
        const originalString = this.getNodeText(node);
        const doubleEscaped = originalString
          .replace(/\\'/g, "'") // Stop escaping single quotes
          .replace(/"/g, '\\"') // Escape double quotes instead
          .replace(/^'|'$/g, '"'); // Replace leading and trailing single quotes with double quotes

        return JSON.parse(doubleEscaped);
      }
      case ParsedToken.UnquotedString:
        return this.getNodeText(node);
      case ParsedToken.List: {
        const list: LiteralValue[] = [];
        let child = node.firstChild;
        do {
          list.push(this.parseLiteral(child) as LiteralValue);
          child = child.nextSibling;
        } while (child);
        return list;
      }
      default: {
        throw new Error(`Unexpected literal token: ${token}`);
      }
    }
  }

  private getNodeText(node: SyntaxNode): string {
    return this.input.substring(node.from, node.to);
  }

  private filterAndMapTokens(tokens: { type: ParsedToken; text: string }[]): string[] {
    const tokenTypes = [
      ParsedToken.Property,
      ParsedToken.Comparator,
      ParsedToken.Value,
      ParsedToken.Or,
      ParsedToken.And,
      ParsedToken.Error,
    ];

    const queryTokens = tokens
      .filter((item) => tokenTypes.includes(item.type) && item.text && item.text !== '"' && item.text !== "'")
      .map((item) => item.text);
    const lastToken = queryTokens[queryTokens.length - 1];
    const secondLastToken = queryTokens[queryTokens.length - 2];

    if (secondLastToken?.startsWith('(') && secondLastToken?.includes(lastToken)) {
      queryTokens.pop();
    }

    return queryTokens;
  }

  private mapValueByPropertyType(
    property: SearchProperty<T>,
    value: LiteralValue | LiteralValue[],
  ): LiteralValue | LiteralValue[] {
    if (property?.propertyType === PropertyType.Date) {
      return this.formatUnixSecondsToDate(value as number | number[]);
    }

    if (property?.propertyType === PropertyType.Memory) {
      return this.formatMemoryValue(property, value);
    }

    if (property?.propertyType === PropertyType.Text && property.enumMap) {
      return this.formatTextValue(property, value);
    }

    return value;
  }

  private formatUnixSecondsToDate(value: number | number[]): string | string[] {
    const convertUnixSeconds = (seconds: number): string => {
      return format(fromUnixTime(seconds), 'yyyy-MM-dd');
    };

    if (Array.isArray(value)) {
      return value.map(convertUnixSeconds);
    }

    return convertUnixSeconds(value);
  }

  private formatMemoryValue(
    property: SearchProperty<T>,
    value: LiteralValue | LiteralValue[],
  ): string | string[] {
    const formatValue = (memoryValue: LiteralValue): string => {
      return property.formatValue(memoryValue);
    };

    if (Array.isArray(value)) {
      return value.map(formatValue);
    }

    return formatValue(value);
  }

  private formatTextValue(
    property: SearchProperty<T>,
    value: LiteralValue | LiteralValue[],
  ): string | string[] {
    const parseValue = (textValue: LiteralValue): string => {
      return (
        property.enumMap.get(textValue) ? this.translate.instant(property.enumMap.get(textValue)) : textValue
      ) as string;
    };

    if (Array.isArray(value)) {
      return value.map(parseValue);
    }

    return parseValue(value);
  }

  private parseArrayFromQueryFilter(
    array: QueryFilter<T>[],
    operator: string,
    properties: SearchProperty<T>[],
  ): string {
    const parsedConditions = array.map((element) => this.parseElementFromQueryFilter(element, properties));
    const innerTemplate = parsedConditions.join(` ${operator} `);
    return `(${innerTemplate})`;
  }

  private conditionToStringFromQueryFilter(
    condition: QueryFilter<T>,
    properties: SearchProperty<T>[],
  ): string {
    const [property, comparator, value] = condition;

    const currentProperty = properties.find((prop) => prop.property === property);
    const mappedConditionProperty = currentProperty?.label || property;
    const mappedConditionValue = this.mapValueByPropertyType(currentProperty, value as LiteralValue) as string;

    if (comparator.toUpperCase() === 'IN' || comparator.toUpperCase() === 'NIN') {
      const valueList = Array.isArray(value)
        ? value.map((valueItem) => {
          return `"${this.mapValueByPropertyType(currentProperty, valueItem as LiteralValue | LiteralValue[]) as string}"`;
        }).join(', ')
        : `"${mappedConditionValue}"`;

      return `"${mappedConditionProperty}" ${comparator.toUpperCase()} (${valueList})`;
    }

    return `"${mappedConditionProperty}" ${comparator.toUpperCase()} "${mappedConditionValue}"`;
  }

  private parseElementFromQueryFilter(
    element: QueryFilters<T> | QueryFilter<T> | OrQueryFilter<T>,
    properties: SearchProperty<T>[],
  ): string {
    if (Array.isArray(element)) {
      if (typeof element[0] === 'string' && ['OR', 'AND'].includes((element[0] as string).toUpperCase())) {
        const operator = (element[0] as string).toUpperCase();
        return this.parseArrayFromQueryFilter(element[1] as QueryFilter<T>[], operator, properties);
      }

      if (element.length === 3 && typeof element[1] === 'string') {
        return this.conditionToStringFromQueryFilter(element, properties);
      }

      return this.parseArrayFromQueryFilter(element as QueryFilter<T>[], 'AND', properties);
    }

    return this.conditionToStringFromQueryFilter(element as QueryFilter<T>, properties);
  }
}
