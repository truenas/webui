import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit, output,
  ViewChild,
} from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatCalendar } from '@angular/material/datepicker';
import { MatTooltip } from '@angular/material/tooltip';
import {
  autocompletion, closeBrackets, CompletionContext, startCompletion,
} from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  EditorView, keymap, placeholder,
} from '@codemirror/view';
import { TranslateModule } from '@ngx-translate/core';
import { format } from 'date-fns';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { AdvancedSearchAutocompleteService } from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryParsingError } from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

const setDiagnostics = StateEffect.define<unknown[] | null>();

@Component({
  selector: 'ix-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    IxIconComponent,
    MatCard,
    MatCalendar,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AdvancedSearchComponent<T> implements OnInit {
  @Input() query: QueryFilters<T> = [];
  @Input() properties: SearchProperty<T>[] = [];
  @Input() placeholder: string;

  readonly paramsChange = output<QueryFilters<T>>();
  readonly switchToBasic = output();
  readonly runSearch = output();

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;

  protected hasQueryErrors = false;
  protected queryInputValue: string;
  errorMessages: QueryParsingError[] | null = null;
  protected editorView: EditorView;

  protected showDatePicker$ = this.advancedSearchAutocomplete.showDatePicker$;

  get editorHasValue(): boolean {
    return this.editorView.state.doc?.length > 0;
  }

  constructor(
    private queryParser: QueryParserService<T>,
    private queryToApi: QueryToApiService<T>,
    private advancedSearchAutocomplete: AdvancedSearchAutocompleteService<T>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initEditor();
    this.advancedSearchAutocomplete.setProperties(this.properties);
    this.advancedSearchAutocomplete.setEditorView(this.editorView);

    if (this.query) {
      this.replaceEditorContents(
        this.queryParser.formatFiltersToQuery(this.query, this.properties),
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
      override: [(context: CompletionContext) => this.advancedSearchAutocomplete.getCompletions(context)],
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
          updateListener,
          advancedSearchLinter,
          diagnosticField,
          customKeyMap,
          EditorView.lineWrapping,
          closeBrackets(),
          placeholder(this.placeholder),
        ],
      }),
      parent: this.inputArea.nativeElement,
    });

    this.focusInput();
  }

  hideDatePicker(): void {
    this.showDatePicker$.next(false);
  }

  dateSelected(value: string): void {
    this.appendEditorContents(`"${format(new Date(value), 'yyyy-MM-dd')}" `);
    this.focusInput();
    this.hideDatePicker();
  }

  protected onResetInput(): void {
    this.replaceEditorContents('');
    this.focusInput();
    this.hideDatePicker();
    this.paramsChange.emit([]);
    this.runSearch.emit();
  }

  private focusInput(): void {
    this.editorView.focus();
  }

  private onInputChanged(): void {
    this.queryInputValue = this.editorView.state.doc.toString();
    const parsedQuery = this.queryParser.parseQuery(this.queryInputValue);

    this.hasQueryErrors = Boolean(this.queryInputValue.length && parsedQuery.hasErrors);
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    if (parsedQuery.hasErrors && this.queryInputValue?.length) {
      this.errorMessages = parsedQuery.errors;
      this.editorView.dispatch({
        effects: setDiagnostics.of(
          parsedQuery.errors.filter((error) => error.from !== error.to),
        ),
      });
      return;
    }

    this.editorView.dispatch({
      effects: setDiagnostics.of([]),
    });
    this.errorMessages = null;

    const filters = this.queryToApi.buildFilters(parsedQuery, this.properties);
    this.paramsChange.emit(filters);
  }

  private replaceEditorContents(contents: string): void {
    this.editorView.dispatch({
      changes: { from: 0, to: this.editorView.state.doc.length, insert: contents },
      selection: { anchor: contents.length },
    });
  }

  private appendEditorContents(contents: string): void {
    this.editorView.dispatch({
      changes: { from: this.editorView.state.doc.length, insert: contents },
      selection: { anchor: this.editorView.state.doc.length + contents.length },
    });
  }
}
