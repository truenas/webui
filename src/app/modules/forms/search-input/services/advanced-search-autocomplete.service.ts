import { Injectable } from '@angular/core';
import { CompletionContext, CompletionResult, startCompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { TranslateService } from '@ngx-translate/core';
import { uniqBy } from 'lodash-es';
import {
  BehaviorSubject,
  Observable, lastValueFrom, map, of,
} from 'rxjs';
import { QueryContext, ContextType } from 'app/interfaces/advanced-search.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryComparator } from 'app/interfaces/query-api.interface';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { PropertyType, SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';

const inComparator = 'in';
const ninComparator = 'nin';
const comparatorSuggestions: QueryComparator[] = [
  '=', '!=', '>', '<', '<=', '>=', '~', '^', '$', '!^', '!$', inComparator, ninComparator, 'rin', 'rnin',
];

const orSuggestion = 'OR';
const andSuggestion = 'AND';
const logicalSuggestions = [andSuggestion, orSuggestion];

const regexMap = {
  // Starts and ends with parentheses containing a quoted non-whitespace string.
  strictQuotedString: /^\("\S+"\)$/,
  // Starts with a quote, includes any characters, optionally ends with a quote.
  looselyQuotedString: /^["'].*["']?$/,
  // Starts and ends with a quote, capturing the content in between.
  captureBetweenQuotes: /^["']([\s\S]*)["']$/,
  // Starts and ends with parentheses and a quote, capturing all content in between.
  captureBetweenQuotesWithParentheses: /^\(["']([\s\S]*)["']\)$/,
  containsWhitespace: /\s/,
};

@Injectable({
  providedIn: 'root',
})
export class AdvancedSearchAutocompleteService<T> {
  private properties: SearchProperty<T>[] = [];
  private editorView: EditorView;
  private queryContext: QueryContext;

  private comparatorHints = {
    '=': this.translate.instant('{comparator} (Equals)', { comparator: '=' }),
    '!=': this.translate.instant('{comparator} (Not Equals)', { comparator: '!=' }),
    '<': this.translate.instant('{comparator} (Less Than)', { comparator: '<' }),
    '>': this.translate.instant('{comparator} (Greater Than)', { comparator: '>' }),
    '<=': this.translate.instant('{comparator} (Less Than or Equal To)', { comparator: '<=' }),
    '>=': this.translate.instant('{comparator} (Greater Than or Equal To)', { comparator: '>=' }),
    '~': this.translate.instant('{comparator} (Contains)', { comparator: '~' }),
    '^': this.translate.instant('{comparator} (Starts With)', { comparator: '^' }),
    '!^': this.translate.instant('{comparator} (Not Starts With)', { comparator: '!^' }),
    '!$': this.translate.instant('{comparator} (Not Ends With)', { comparator: '!$' }),
    rin: this.translate.instant('{comparator} (Range In)', { comparator: 'RIN' }),
    rnin: this.translate.instant('{comparator} (Range Not In)', { comparator: 'RNIN' }),
    in: this.translate.instant('{comparator} (In)', { comparator: 'IN' }),
    nin: this.translate.instant('{comparator} (Not In)', { comparator: 'NIN' }),
    $: this.translate.instant('{comparator} (Ends With)', { comparator: '$' }),
  } as { [key in QueryComparator]: string };

  showDatePicker$ = new BehaviorSubject(false);

  constructor(
    private queryParser: QueryParserService<T>,
    private translate: TranslateService,
  ) {}

  setProperties(properties: SearchProperty<T>[]): void {
    this.properties = properties;
  }

  setEditorView(editorView: EditorView): void {
    this.editorView = editorView;
  }

  getCompletions(context: CompletionContext): Promise<CompletionResult> {
    const currentQuery = context.state.doc.toString();
    this.queryContext = this.getQueryContext(currentQuery, context.pos);
    const suggestions$ = this.generateSuggestionsBasedOnContext(this.queryContext);

    const from = currentQuery.length < this.queryContext.startPosition ? 0 : this.queryContext.startPosition;
    const to = this.queryContext.endPosition;

    return lastValueFrom(
      suggestions$.pipe(
        map((suggestions) => ({
          from,
          to,
          options: uniqBy(suggestions, 'label')
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((hint) => ({
              label: this.translate.instant(hint.label),
              apply: () => this.applySuggestionTransformation(hint, currentQuery, from, to),
              boost: (hint as unknown as { boost: number })?.boost,
            })),
        })),
      ),
    );
  }

  private applySuggestionTransformation(
    suggestion: Option,
    currentQuery: string,
    from: number,
    to: number,
  ): void {
    let updatedValue = suggestion.value.toString();
    let anchor = regexMap.strictQuotedString.test(updatedValue)
      ? from + updatedValue.length - 1
      : from + updatedValue.length;

    if (
      regexMap.looselyQuotedString.test(currentQuery[from - 1]) && regexMap.looselyQuotedString.test(currentQuery[to])
    ) {
      updatedValue = updatedValue.replace(regexMap.captureBetweenQuotes, '$1');
      anchor = from + updatedValue.length + 1;

      if (updatedValue.startsWith('(') && updatedValue.endsWith(')')) {
        updatedValue = `("${updatedValue.replace(regexMap.captureBetweenQuotesWithParentheses, '$1')}")`;
        from = from - 1;
        to = to + 1;
        anchor = from + updatedValue.length - 1;
      }
    } else if (
      regexMap.containsWhitespace.test(updatedValue) && !regexMap.looselyQuotedString.test(updatedValue)
      && !updatedValue.startsWith('(') && !updatedValue.endsWith(')')
    ) {
      updatedValue = `"${updatedValue}"`;
      anchor = anchor + 2;
    }

    const shouldAppendSpace = !updatedValue.startsWith('(') && currentQuery[to] !== ')'
      && currentQuery[to] !== '"' && currentQuery[to] !== "'";

    this.editorView?.dispatch({
      changes: { from, to, insert: shouldAppendSpace ? `${updatedValue} ` : updatedValue },
      selection: { anchor: shouldAppendSpace ? anchor + 1 : anchor },
    });

    startCompletion(this.editorView);
  }

  private getQueryContext(query: string, cursorPosition: number): QueryContext {
    const tokens = this.queryParser.extractTokens(query.substring(0, cursorPosition));
    const { lastToken, secondLastToken } = this.getTokenParts(tokens);
    let contextType = ContextType.Property;

    const isPropertyType = comparatorSuggestions.some((item) => item?.toLowerCase() === lastToken?.toLowerCase())
      || this.isPartiallyLogicalOperator(lastToken);

    const isLogicalOperatorType = (
      this.isCompleteExpression(tokens, cursorPosition, query)
      && !this.isPartiallyLogicalOperator(lastToken)
      && (!lastToken?.startsWith('(') || (lastToken?.startsWith('(') && lastToken?.endsWith(')')))
    ) || (
      this.isPartiallyComparator(secondLastToken) && query[cursorPosition] === ')'
      && (
        (secondLastToken?.toLowerCase() === inComparator || secondLastToken?.toLowerCase() === ninComparator)
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
    return comparatorSuggestions.map((item) => item?.toLowerCase())?.includes(token?.toLowerCase());
  }

  private isPartiallyLogicalOperator(token: string): boolean {
    return logicalSuggestions.map((item) => item?.toLowerCase())?.includes(token?.toLowerCase());
  }

  private generateSuggestionsBasedOnContext(context: QueryContext): Observable<Option[]> {
    const { lastToken, secondLastToken, thirdLastToken } = this.getTokenParts(context.tokens);

    const isInOrNin = (lastToken?.toLowerCase() === inComparator || lastToken?.toLowerCase() === ninComparator)
      || secondLastToken?.toLowerCase() === inComparator || secondLastToken?.toLowerCase() === ninComparator;

    const searchedProperty = this.properties?.find((property) => {
      return property.label?.toLowerCase() === thirdLastToken?.replace(regexMap.captureBetweenQuotes, '$1')?.toLowerCase()
        || (property.label?.toLowerCase() === secondLastToken?.replace(regexMap.captureBetweenQuotes, '$1')?.toLowerCase()
          && this.isPartiallyComparator(lastToken));
    });

    this.showDatePicker$.next(false);

    switch (context.type) {
      case ContextType.Property:
        if (isInOrNin && !lastToken?.startsWith('(') && searchedProperty?.valueSuggestions$) {
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
          if (
            searchedProperty.propertyType === PropertyType.Date && lastToken && secondLastToken
            && !this.isPartiallyComparator(secondLastToken) && this.isPartiallyComparator(lastToken)
          ) {
            this.showDatePicker$.next(true);
            return of([]);
          }

          return searchedProperty?.valueSuggestions$ || of([]);
        }

        return of(this.properties.map((property) => ({ label: property.label, value: property.label })));

      case ContextType.Logical:
        return of(logicalSuggestions.map((property) => ({ label: property, value: property })));

      case ContextType.Comparator:
        return of(comparatorSuggestions.map((property, index) => ({
          label: this.comparatorHints?.[property] || property,
          value: property.toUpperCase(),
          boost: comparatorSuggestions.length - index,
        })));
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
