import { Injectable } from '@angular/core';
import { SyntaxNode, TreeCursor } from '@lezer/common';
import { QueryComparator } from 'app/interfaces/query-api.interface';
import { parser } from 'app/modules/search-input/services/query-parser/query-grammar';
import {
  Condition,
  ConditionGroup, ConnectorType, LiteralValue, ParsedToken,
  QueryParsingResult, QuerySyntaxError,
} from 'app/modules/search-input/services/query-parser/query-parsing-result.interface';

@Injectable()
export class QueryParserService {
  private input: string;

  extractTokens(query: string): string[] {
    const tree = parser.parse(query);
    const cursor = tree.cursor();
    const tokens: { type: string; text: string }[] = [];

    const explore = (nextCursor: TreeCursor): void => {
      do {
        const nodeType = nextCursor.node.type.name;
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
        errors: [error],
        tree: null,
      };
    }
  }

  private getSyntaxErrors(startingNode: SyntaxNode): QuerySyntaxError[] {
    const errors: QuerySyntaxError[] = [];
    startingNode.cursor().iterate((node) => {
      if (node.name !== ParsedToken.Error) {
        return;
      }

      errors.push(new QuerySyntaxError(node.from, node.to));
    });

    return errors;
  }

  private parseNode(node: SyntaxNode): ConditionGroup | Condition {
    if (node.name === ParsedToken.ConditionGroup) {
      return this.parseConditionGroup(node);
    } else if (node.name === ParsedToken.Condition) {
      return this.parseCondition(node);
    } else {
      throw new Error(`Unexpected node: ${node.name}`);
    }
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
    return node.name === ParsedToken.Or ? ConnectorType.Or : ConnectorType.And;
  }

  private parseLiteral(node: SyntaxNode): LiteralValue | LiteralValue[] {
    switch (node.name) {
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
    }
  }

  private getNodeText(node: SyntaxNode): string {
    return this.input.substring(node.from, node.to);
  }

  private filterAndMapTokens(tokens: { type: string; text: string }[]): string[] {
    const tokenTypes = ['Property', 'Comparator', 'Value', 'Or', 'And', '⚠'];

    const queryTokens = tokens
      .filter(item => tokenTypes.includes(item.type) && item.text && item.text !== '"' && item.text !== "'")
      .map(item => item.text);
    const lastToken = queryTokens[queryTokens.length - 1];
    const secondLastToken = queryTokens[queryTokens.length - 2];

    if (secondLastToken?.startsWith('(') && secondLastToken?.includes(lastToken)) {
      queryTokens.pop();
    }

    return queryTokens;
  }
}
