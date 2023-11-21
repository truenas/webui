import { Injectable } from '@angular/core';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { uniqBy } from 'lodash';
import { Observable, lastValueFrom, map, of } from 'rxjs';
import { QueryContext, ContextType } from 'app/interfaces/advanced-search.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryComparator } from 'app/interfaces/query-api.interface';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

const comparatorSuggestions = ['=', '!=', '<', '>', '<=', '>=', 'IN', 'NIN', '~', '^', '!^', '$', '!$'] as QueryComparator[];
const logicalSuggestions = ['AND', 'OR'];

@Injectable()
export class AdvancedSearchAutocompleteService<T> {
  private properties: SearchProperty<T>[] = [];

  constructor(
    private queryParser: QueryParserService,
  ) {}

  setProperties(properties: SearchProperty<T>[]): void {
    this.properties = properties;
  }

  setCompletionSource(context: CompletionContext): Promise<CompletionResult> {
    const currentQuery = context.state.doc.toString();
    const cursorPosition = context.pos;
    const queryContext = this.getQueryContext(currentQuery, cursorPosition);
    const suggestions$ = this.generateSuggestionsBasedOnContext(queryContext);
    const currentToken = context.matchBefore(/\w*/);

    const from = currentQuery.length < queryContext.startPosition ? 0 : queryContext.startPosition;
    const to = queryContext.endPosition;

    return lastValueFrom(
      suggestions$.pipe(
        map((suggestions) => ({
          from,
          options: uniqBy(suggestions, 'label')
            .filter((suggestion) => {
              return suggestion.label && (
                suggestion.label.toLowerCase().startsWith(currentToken?.text.toLowerCase()) ||
                suggestion.value.toString().toLowerCase().startsWith(currentToken?.text.toLowerCase())
              );
            })
            .map((suggestion) => ({
              label: suggestion.label,
              apply(view) {
                const updatedValue = suggestion.value.toString();
                const transaction = view.state.update({
                  changes: { from, to, insert: updatedValue },
                  selection: { anchor: /^\("\S+"\)$/.test(updatedValue)
                    ? from + updatedValue.length - 1
                    : from + updatedValue.length },
                });
                view.dispatch(transaction);
              },
            })),
        })),
      ),
    );
  }

  private getQueryContext(query: string, cursorPosition: number): QueryContext {
    const tokens = this.queryParser.tokenizeQueryAsOneArray(query.substring(0, cursorPosition));

    let contextType = ContextType.Property;

    const lastToken = tokens[tokens.length - 1];

    if (this.isComparator(lastToken)) {
      contextType = ContextType.Property;
    } else if (
      this.isCompleteExpression(tokens, cursorPosition, query) || (
        this.isCompleteExpression(tokens.slice(0, -1), cursorPosition, query) &&
                lastToken && !logicalSuggestions.some((value) => value.toUpperCase() === lastToken.toUpperCase())
      )
    ) {
      contextType = ContextType.Logical;
    } else if (
      this.isProperty(lastToken) || (
        !this.isCompleteExpression(tokens, cursorPosition, query) &&
                lastToken &&
                comparatorSuggestions.some((comparator) => comparator.toUpperCase().includes(lastToken.toUpperCase()))
      )
    ) {
      contextType = ContextType.Comparator;
    }

    const needCurrentCursorPosition = (this.isComparator(lastToken) || query[cursorPosition - 1] === ' ');

    const startPosition = needCurrentCursorPosition
      ? cursorPosition
      : (lastToken?.trim()?.lastIndexOf(' ') + 1 + cursorPosition - lastToken?.length);

    return {
      lastToken,
      tokens,
      startPosition,
      query,
      type: contextType,
      endPosition: cursorPosition,
    };
  }

  private isCompleteExpression(tokens: string[], cursorPosition: number, query: string): boolean {
    if (tokens.length < 3) {
      return false;
    }

    const lastToken = tokens[tokens.length - 1];
    const secondLastToken = tokens[tokens.length - 2];
    const thirdLastToken = tokens[tokens.length - 3];

    const isBasicPattern = this.isProperty(thirdLastToken) &&
            this.isComparator(secondLastToken) && !this.isComparator(lastToken);
    const isQuoted = this.isQuotedString(lastToken);

    return (isBasicPattern && isQuoted) ||
      (isBasicPattern && query[cursorPosition - 1] === ' ' && !query[cursorPosition]);
  }

  private isProperty(token: string): boolean {
    return this.properties.map(property => property.label).includes(token);
  }

  private isComparator(token: string): boolean {
    return comparatorSuggestions.map((item) => item?.toUpperCase())?.includes(token?.toUpperCase() as QueryComparator);
  }

  private generateSuggestionsBasedOnContext(context: QueryContext): Observable<Option[]> {
    // TODO:
    // eslint-disable-next-line no-console
    console.log(context);
    const firstTokenFromEnd = context.tokens[context.tokens.length - 3];
    const secondTokenFromEnd = context.tokens[context.tokens.length - 2];
    const thirdTokenFromEnd = context.tokens[context.tokens.length - 1];

    switch (context.type) {
      case ContextType.Property:
        const isInOrNin = (thirdTokenFromEnd?.toUpperCase() === 'IN' || thirdTokenFromEnd?.toUpperCase() === 'NIN') ||
          secondTokenFromEnd?.toUpperCase() === 'IN' || secondTokenFromEnd?.toUpperCase() === 'NIN';

        const searchedProperty = this.properties?.find((property) =>
          property.label === firstTokenFromEnd ||
          (property.label === secondTokenFromEnd && this.isComparator(thirdTokenFromEnd?.toUpperCase())),
        );

        if (isInOrNin && !thirdTokenFromEnd.startsWith('(')) {
          return searchedProperty?.valueSuggestions$.pipe(
            map((options) => {
              return options.map(({ label, value }) => ({ label, value: `(${value})` }));
            }),
          );
        }

        if (this.isComparator(thirdTokenFromEnd) && !searchedProperty) {
          return of([]);
        }

        if (searchedProperty) {
          return searchedProperty?.valueSuggestions$;
        }

        return of(this.properties.map(property => ({ label: property.label, value: property.label })));

      case ContextType.Logical:
        return of(logicalSuggestions.map(property => ({ label: property, value: property })));

      case ContextType.Comparator:
        return of(comparatorSuggestions.map(property => ({ label: property, value: property.toUpperCase() })));
      default:
        return of([]);
    }
  }

  private isQuotedString(token: string): boolean {
    return (token.startsWith('"') && token.endsWith('"') && token.length > 1) ||
      (token.startsWith("'") && token.endsWith("'") && token.length > 1);
  }
}
