import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { autocompletion, closeBrackets, startCompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  EditorView, keymap, placeholder,
} from '@codemirror/view';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { AdvancedSearchAutocompleteService } from 'app/modules/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
import { QueryParsingError } from 'app/modules/search-input/services/query-parser/query-parsing-result.interface';
import { QueryToApiService } from 'app/modules/search-input/services/query-to-api/query-to-api.service';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

const setDiagnostics = StateEffect.define<unknown[] | null>();

@Component({
  selector: 'ix-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent<T> implements OnInit {
  @Input() query: QueryFilters<T> = [];
  @Input() properties: SearchProperty<T>[] = [];

  @Output() paramsChange = new EventEmitter<QueryFilters<T>>();
  @Output() switchToBasic = new EventEmitter<void>();
  @Output() runSearch = new EventEmitter<void>();
  @Output() advancedSearchQueryValidityChanged = new EventEmitter<boolean>();

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;

  hasQueryErrors = false;
  queryInputValue: string;
  errorMessages: QueryParsingError[] | null = null;
  editorView: EditorView;

  showDatePicker$ = this.advancedSearchAutocomplete.showDatePicker$;

  get editorHasValue(): boolean {
    return (this.editorView.state.doc as unknown as { text: string[] })?.text?.[0] !== '';
  }

  constructor(
    private queryParser: QueryParserService,
    private queryToApi: QueryToApiService<T>,
    private advancedSearchAutocomplete: AdvancedSearchAutocompleteService<T>,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.initEditor();
    this.advancedSearchAutocomplete.setProperties(this.properties);
    this.advancedSearchAutocomplete.setEditorView(this.editorView);

    if (this.query) {
      this.setEditorContents(
        this.queryParser.formatFiltersToQuery(
          this.query as QueryFilters<never>,
          this.properties as SearchProperty<never>[],
        ),
      );
    }
  }

  startSuggestionsCompletion(): void {
    startCompletion(this.editorView);
  }

  initEditor(): void {
    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      this.onInputChanged();
    });

    const diagnosticField = StateField.define({
      create() {
        return [];
      },
      update(diagnostics, transaction) {
        for (const effect of transaction.effects) {
          if (effect.is(setDiagnostics)) {
            return effect.value;
          }
        }
        return diagnostics;
      },
    });

    const advancedSearchLinter = linter((view) => view.state.field(diagnosticField));

    const autocompleteExtension = autocompletion({
      override: [this.advancedSearchAutocomplete.setCompletionSource.bind(this.advancedSearchAutocomplete)],
      icons: false,
    });

    const customKeyMap = keymap.of([{
      key: 'Enter',
      run: () => {
        this.runSearch.emit();
        return true;
      },
    }]);

    this.editorView = new EditorView({
      state: EditorState.create({
        extensions: [
          autocompleteExtension,
          EditorView.lineWrapping,
          updateListener,
          closeBrackets(),
          placeholder(this.translate.instant('Service = "SMB" AND Event = "CLOSE"')),
          advancedSearchLinter,
          diagnosticField,
          customKeyMap,
        ],
      }),
      parent: this.inputArea.nativeElement,
    });

    this.editorView.focus();
  }

  dateSelected(value: string): void {
    this.setEditorContents(`"${format(new Date(value), 'yyyy-MM-dd')}" `, this.editorView.state.doc.length);
    this.editorView.focus();
    this.showDatePicker$.next(false);
  }

  protected onResetInput(): void {
    this.setEditorContents('', 0, this.editorView.state.doc.length);
    this.showDatePicker$.next(false);
    this.paramsChange.emit([]);
  }

  private onEditorBlur(): void {
    this.showDatePicker$.next(false);
  }

  private onInputChanged(): void {
    this.queryInputValue = this.editorView.state.doc.toString();
    const parsedQuery = this.queryParser.parseQuery(this.queryInputValue);

    this.hasQueryErrors = Boolean(this.queryInputValue.length && parsedQuery.hasErrors);
    this.advancedSearchQueryValidityChanged.emit(!this.hasQueryErrors);
    this.cdr.markForCheck();

    if (this.queryInputValue === '') {
      this.onResetInput();
    }

    if (parsedQuery.hasErrors && this.queryInputValue?.length) {
      this.errorMessages = parsedQuery.errors;
      this.editorView.dispatch({
        effects: setDiagnostics.of(
          parsedQuery.errors.filter((error) => error.from !== error.to),
        ),
      });
    } else {
      this.editorView.dispatch({
        effects: setDiagnostics.of([]),
      });
      this.errorMessages = null;
    }

    const filters = this.queryToApi.buildFilters(parsedQuery, this.properties);

    this.paramsChange.emit(filters);
  }

  private setEditorContents(contents: string, from = 0, to?: number): void {
    this.editorView.dispatch({
      changes: { from, to, insert: contents },
      selection: { anchor: from + contents.length },
    });
  }
}
