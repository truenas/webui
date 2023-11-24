import { Injectable } from '@angular/core';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { uniqBy } from 'lodash';
import {
  Observable, lastValueFrom, map, of,
} from 'rxjs';
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
                suggestion.label.toUpperCase().startsWith(currentToken?.text?.toUpperCase())
                || suggestion.value.toString().toUpperCase().startsWith(currentToken?.text?.toUpperCase())
              );
            })
            .map((suggestion) => ({
              label: suggestion.label,
              apply: (view) => this.applySuggestionTransformation(view, suggestion, currentQuery, from, to),
            })),
        })),
      ),
    );
  }

  private applySuggestionTransformation(
    view: EditorView,
    suggestion: Option,
    currentQuery: string,
    from: number,
    to: number,
  ): void {
    let updatedValue = suggestion.value.toString();
    let anchor = /^\("\S+"\)$/.test(updatedValue)
      ? from + updatedValue.length - 1
      : from + updatedValue.length;

    if (
      /^["'].*["']?$/.test(currentQuery[from - 1]) && /^["'].*["']?$/.test(currentQuery[to])
    ) {
      updatedValue = updatedValue.replace(/['"]/g, '');
      anchor = from + updatedValue.length + 1;

      if (updatedValue.startsWith('(') && updatedValue.endsWith(')')) {
        updatedValue = `("${updatedValue.replace(/[()'"]/g, '')}")`;
        from = from - 1;
        to = to + 1;
        anchor = from + updatedValue.length - 1;
      }
    }

    view.dispatch(
      view.state.update({
        changes: { from, to, insert: updatedValue },
        selection: { anchor },
      }),
    );
  }

  private getQueryContext(query: string, cursorPosition: number): QueryContext {
    const tokens = this.queryParser.extractTokens(query.substring(0, cursorPosition));
    const { lastToken, secondLastToken } = this.getTokenParts(tokens);
    let contextType = ContextType.Property;

    const isPropertyType = comparatorSuggestions.some((item) => item?.toUpperCase() === lastToken?.toUpperCase())
      || this.isPartiallyLogicalOperator(lastToken);

    const isLogicalOperatorType = (
      this.isCompleteExpression(tokens, cursorPosition, query)
      && !this.isPartiallyLogicalOperator(lastToken)
      && (!lastToken?.startsWith('(') || (lastToken?.startsWith('(') && lastToken?.endsWith(')')))
    ) || (
      this.isPartiallyComparator(secondLastToken) && query[cursorPosition] === ')'
      && (
        (secondLastToken?.toUpperCase() === 'IN' || secondLastToken?.toUpperCase() === 'NIN')
        && lastToken?.startsWith('(') && lastToken?.endsWith(')')
      )
    );

    const isComparatorType = (
      (
        !this.isPartiallyComparator(secondLastToken)
        && !this.isPartiallyLogicalOperator(secondLastToken)
        && !this.isPartiallyLogicalOperator(lastToken)
        && secondLastToken?.length > 0
      ) || (
        lastToken?.length > 0 && query[cursorPosition - 1] === ' '
        && (
          query[cursorPosition] !== ')'
          || ((!secondLastToken || this.isPartiallyLogicalOperator(secondLastToken)) && query[cursorPosition] === ')')
        )
      )
    ) && !isLogicalOperatorType && !this.isPartiallyComparator(secondLastToken);

    if (isPropertyType) {
      contextType = ContextType.Property;
    } else if (isComparatorType) {
      contextType = ContextType.Comparator;
    } else if (isLogicalOperatorType) {
      contextType = ContextType.Logical;
    }

    const shouldUseCursorPosition = this.isPartiallyComparator(lastToken)
      || query[cursorPosition - 1] === ' ';

    const customCursorStart = cursorPosition - (lastToken?.length || 0);
    const customCursorLastSpaceCondition = (((lastToken?.trim()?.lastIndexOf(' ')) ?? -1) + 1 || 0);
    const customCursorAdjustment = (lastToken?.includes('(') && !lastToken?.includes(' ') ? 1 : 0)
      + (lastToken?.includes('"') && query[cursorPosition] === '"' ? 1 : 0)
      + (lastToken?.includes("'") && query[cursorPosition] === "'" ? 1 : 0);
    const customCursorPosition = customCursorLastSpaceCondition + customCursorStart + customCursorAdjustment;

    const startPosition = (shouldUseCursorPosition ? cursorPosition : customCursorPosition) || 0;

    return {
      tokens,
      query,
      startPosition,
      type: contextType,
      endPosition: cursorPosition,
    };
  }

  private isCompleteExpression(tokens: string[], cursorPosition: number, query: string): boolean {
    if (tokens.length < 3) {
      return false;
    }

    const { lastToken, secondLastToken, thirdLastToken } = this.getTokenParts(tokens);

    return (
      (
        thirdLastToken?.length > 0 && (
          this.isPartiallyComparator(secondLastToken) && lastToken?.length > 0 && query[cursorPosition - 1] === ' '
        )
      )
      || (lastToken?.length > 0 && secondLastToken?.length > 0 && this.isPartiallyComparator(thirdLastToken))
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

    const { lastToken, secondLastToken, thirdLastToken } = this.getTokenParts(context.tokens);

    const isInOrNin = (lastToken?.toUpperCase() === 'IN' || lastToken?.toUpperCase() === 'NIN')
      || secondLastToken?.toUpperCase() === 'IN' || secondLastToken?.toUpperCase() === 'NIN';

    const searchedProperty = this.properties?.find((property) => property.label?.toUpperCase() === thirdLastToken?.replace(/['"]/g, '')?.toUpperCase()
      || (property.label?.toUpperCase() === secondLastToken?.replace(/['"]/g, '')?.toUpperCase()
      && this.isPartiallyComparator(lastToken?.toUpperCase())));

    switch (context.type) {
      case ContextType.Property:
        if (isInOrNin && !lastToken?.startsWith('(') && searchedProperty) {
          return searchedProperty.valueSuggestions$.pipe(
            map((options: Option[]) => options.map(({ label, value }) => ({ label, value: `(${value})` }))),
          );
        }

        if (
          (!isInOrNin && this.isPartiallyComparator(lastToken) && !searchedProperty)
          || (
            !isInOrNin
            && context.query[context.endPosition - 1] === ' '
            && context.query[context.endPosition] === ')'
            && this.isPartiallyComparator(secondLastToken)
          )
          || (this.isPartiallyComparator(secondLastToken) && !searchedProperty)
        ) {
          return of([]);
        }

        if (searchedProperty) {
          return searchedProperty?.valueSuggestions$;
        }

        return of(this.properties.map((property) => ({ label: property.label, value: property.label })));

      case ContextType.Logical:
        return of(logicalSuggestions.map((property) => ({ label: property, value: property })));

      case ContextType.Comparator:
        return of(comparatorSuggestions.map((property) => ({ label: property, value: property.toUpperCase() })));
      default:
        return of([]);
    }
  }

  private getTokenParts(tokens: string[]): { lastToken: string; secondLastToken: string; thirdLastToken: string } {
    const lastToken = tokens[tokens.length - 1];
    const secondLastToken = tokens[tokens.length - 2];
    const thirdLastToken = tokens[tokens.length - 3];

    return { lastToken, secondLastToken, thirdLastToken };
  }
}
