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
          to,
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
                  selection: {
                    anchor: /^\("\S+"\)$/.test(updatedValue)
                      ? from + updatedValue.length - 1
                      : from + updatedValue.length,
                  },
                });
                view.dispatch(transaction);
              },
            })),
        })),
      ),
    );
  }

  private getQueryContext(query: string, cursorPosition: number): QueryContext {
    const tokens = this.queryParser.extractTokens(query.substring(0, cursorPosition));
    const lastToken = tokens[tokens.length - 1];
    const secondLastToken = tokens[tokens.length - 2];
    let contextType = ContextType.Property;

    const isPropertyType = comparatorSuggestions.some((item) => item?.toUpperCase() === lastToken?.toUpperCase()) ||
      this.isPartiallyLogicalOperator(lastToken);

    const isLogicalOperatorType = this.isCompleteExpression(tokens, cursorPosition, query) &&
      !this.isPartiallyLogicalOperator(lastToken);

    const isComparatorType = ((!this.isPartiallyComparator(secondLastToken) &&
      !this.isPartiallyLogicalOperator(secondLastToken) &&
      !this.isPartiallyLogicalOperator(lastToken) &&
      secondLastToken?.length > 0) || (
      lastToken?.length > 0 &&
        (lastToken?.length > 0 && (cursorPosition > 0 && query[cursorPosition - 1] === ' ' && query[cursorPosition] !== ')'))
    )) && !isLogicalOperatorType;

    if (isPropertyType) {
      contextType = ContextType.Property;
    } else if (isComparatorType) {
      contextType = ContextType.Comparator;
    } else if (isLogicalOperatorType) {
      contextType = ContextType.Logical;
    }

    const startPosition = this.isPartiallyComparator(lastToken) || query[cursorPosition - 1] === ' '
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

    return (
      (thirdLastToken?.length > 0 && (
        this.isPartiallyComparator(secondLastToken) &&
          lastToken.length > 0 &&
          query[cursorPosition - 1] === ' ' && query[cursorPosition] !== ')'
      )) ||
      (lastToken?.length > 0 &&
       secondLastToken?.length > 0 &&
       this.isPartiallyComparator(thirdLastToken)
      )
    );
  }

  private isPartiallyComparator(token: string): boolean {
    return comparatorSuggestions.map((item) => item?.toUpperCase())?.includes(token?.toUpperCase());
  }

  private isPartiallyLogicalOperator(token: string): boolean {
    return logicalSuggestions.map((item) => item?.toUpperCase())?.includes(token?.toUpperCase());
  }

  private generateSuggestionsBasedOnContext(context: QueryContext): Observable<Option[]> {
    // TODO:
    // eslint-disable-next-line no-console
    console.log(context);

    const lastToken = context.tokens[context.tokens.length - 3];
    const secondLastToken = context.tokens[context.tokens.length - 2];
    const thirdLastToken = context.tokens[context.tokens.length - 1];

    switch (context.type) {
      case ContextType.Property:
        const isInOrNin = (thirdLastToken?.toUpperCase() === 'IN' || thirdLastToken?.toUpperCase() === 'NIN') ||
          secondLastToken?.toUpperCase() === 'IN' || secondLastToken?.toUpperCase() === 'NIN';

        const searchedProperty = this.properties?.find((property) =>
          property.label === lastToken ||
          (property.label === secondLastToken && this.isPartiallyComparator(thirdLastToken?.toUpperCase())),
        );

        if (isInOrNin && !thirdLastToken.startsWith('(') && searchedProperty) {
          return searchedProperty.valueSuggestions$.pipe(
            map((options) => options.map(({ label, value }) => ({ label, value: `(${value})` }))),
          );
        }

        if (this.isPartiallyComparator(thirdLastToken) && !searchedProperty) {
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
}
