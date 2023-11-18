import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges, OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CompletionContext, CompletionResult, autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

enum ContextType {
  Field = 'field',
  Logical = 'logical',
  Operator = 'operator',
}

interface QueryContext {
  type: ContextType;
  startPos: number;
  endPos: number;
  tokens: string[];
  lastToken: string;
}

const operatorSuggestions = ['=', '!=', '<', '>', '<=', '>=', 'IN', 'NIN', '~', '^', '!^', '$', '!$'];
const logicalSuggestions = ['AND', 'OR', 'ORDER BY'];

@Component({
  selector: 'ix-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent<T> implements OnInit, OnChanges {
  @Input() query: QueryFilters<T> = [];
  @Input() properties: SearchProperty<T>[] = [];

  @Output() queryChange = new EventEmitter<QueryFilters<T>>();
  @Output() switchToBasic = new EventEmitter<void>();

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;

  private editorView: EditorView;

  constructor(
    private queryParser: QueryParserService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.query && this.editorView) {
      // TODO:
      // this.setEditorContents(this.queryParser.formatFiltersToQuery(this.query, this.properties));
    }
  }

  ngOnInit(): void {
    this.initEditor();
  }

  initEditor(): void {
    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      this.onInputChanged();
    });

    const autocompleteExtension = autocompletion({
      override: [this.completionSource.bind(this)],
    });

    this.editorView = new EditorView({
      state: EditorState.create({
        extensions: [
          autocompleteExtension,
          EditorView.lineWrapping,
          updateListener,
          closeBrackets(),
        ],
      }),
      parent: this.inputArea.nativeElement,
    });
  }

  protected onResetInput(): void {
    this.setEditorContents('');
    this.queryChange.emit([]);
  }

  private onInputChanged(): void {
    const query = this.editorView.state.doc.toString();
    const parsedQuery = this.queryParser.parseQuery(query);
    // TODO:
    // eslint-disable-next-line no-console
    console.log(parsedQuery);
    // this.queryChange.emit(parsedQuery);
  }

  private setEditorContents(contents: string): void {
    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: contents,
      },
    });
  }

  private completionSource(context: CompletionContext): CompletionResult | null {
    const currentQuery = context.state.doc.toString();
    const cursorPosition = context.pos;

    // Analyze the query and determine the context
    const queryContext = this.getQueryContext(currentQuery, cursorPosition);

    // Generate suggestions based on the context
    const suggestions = this.generateSuggestionsBasedOnContext(queryContext);

    // Return completion result with correct 'from' position
    return {
      from: currentQuery.length < queryContext.startPos ? 0 : queryContext.startPos,
      options: suggestions?.map(suggestion => ({ label: suggestion })) || [],
    };
  }

  private getQueryContext(query: string, cursorPosition: number): QueryContext {
    let tokens = this.tokenizeQuery(query.substring(0, cursorPosition).trim());
    let contextType: ContextType = ContextType.Field;

    let lastToken = tokens[tokens.length - 1];

    // autocompletion for field options
    if (this.isOperator(tokens[tokens.length - 2]) && !this.isCompleteExpression(tokens, cursorPosition, query)) {
      tokens = [tokens[tokens.length - 3], tokens[tokens.length - 1]];
      lastToken = tokens[tokens.length - 1];
    }

    if (this.isOperator(lastToken)) {
      contextType = ContextType.Field;
    } else if (
      this.isCompleteExpression(tokens, cursorPosition, query) || (
        this.isCompleteExpression(tokens.slice(0, -1), cursorPosition, query) &&
        lastToken && !logicalSuggestions.some((value) => value.toUpperCase() === lastToken.toUpperCase())
      )
    ) {
      contextType = ContextType.Logical;
    } else if (
      this.isField(lastToken) || (
        !this.isCompleteExpression(tokens, cursorPosition, query) &&
        lastToken && operatorSuggestions.some((operator) => operator.toUpperCase().includes(lastToken.toUpperCase()))
      )
    ) {
      contextType = ContextType.Operator;
    }

    // Calculate start position for replacing text
    const startPos = query[cursorPosition - 1] === ' ' ? cursorPosition : cursorPosition - lastToken?.length;

    return {
      type: contextType,
      lastToken: lastToken,
      tokens: tokens,
      startPos: startPos,
      endPos: cursorPosition,
    };
  }

  private tokenizeQuery(query: string): string[] {
    // Regular expression to match quoted strings or words
    const regex = /"[^"]*"|\S+/g;
    return query.match(regex) || [];
  }

  private isQuotedString(token: string): boolean {
    // Check if the token starts and ends with a quote and has more than just two quotes
    return token.startsWith('"') && token.endsWith('"') && token.length > 1;
  }

  private isCompleteExpression(tokens: string[], cursorPosition: number, query: string): boolean {
    if (tokens.length < 3) {
      return false;
    }

    const lastToken = tokens[tokens.length - 1];
    const secondLastToken = tokens[tokens.length - 2];
    const thirdLastToken = tokens[tokens.length - 3];

    // Check if the pattern is field-operator-value
    const isBasicPattern = this.isField(thirdLastToken) &&
      this.isOperator(secondLastToken) && !this.isOperator(lastToken);

    // Additional check to see if the cursor is not in the middle of typing a value
    const isValueComplete = cursorPosition === query.length || query[cursorPosition] === ' ';

    // Updated check for the last token
    const isLastTokenValid = this.isQuotedString(lastToken) && lastToken !== '"';

    return isBasicPattern && isValueComplete && isLastTokenValid;
  }

  private isField(token: string): boolean {
    return this.properties.map(property => property.label).includes(token);
  }

  private isOperator(token: string): boolean {
    return operatorSuggestions.includes(token);
  }

  private generateSuggestionsBasedOnContext(context: QueryContext): string[] {
    // TODO:
    // eslint-disable-next-line no-console
    console.log(context, 'Autocomplete context');

    // Dynamically generate suggestions based on the context
    switch (context.type) {
      case ContextType.Field:
        const withFieldSuggestions = this.properties
          ?.find((property) => property.label === context.tokens[context.tokens.length - 2])?.fieldSuggestions || [];

        if (withFieldSuggestions?.length) {
          return withFieldSuggestions;
        }

        return this.properties.map(property => property.label);

      case ContextType.Logical:
        return logicalSuggestions;

      case ContextType.Operator:
        const withOperatorSuggestions = this.properties
          ?.find((property) => property.label === context.lastToken)?.operatorSuggestions || [];

        if (withOperatorSuggestions?.length) {
          return withOperatorSuggestions;
        }
        return operatorSuggestions;
      default:
        return [];
    }
  }
}
