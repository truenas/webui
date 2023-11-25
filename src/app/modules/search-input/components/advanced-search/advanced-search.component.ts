import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges, OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { autocompletion, closeBrackets, startCompletion } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { AdvancedSearchAutocompleteService } from 'app/modules/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/search-input/services/query-to-api/query-to-api.service';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

@Component({
  selector: 'ix-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent<T> implements OnInit, OnChanges {
  @Input() query: QueryFilters<T> = [];
  @Input() properties: SearchProperty<T>[] = [];

  @Output() paramsChange = new EventEmitter<QueryFilters<T>>();
  @Output() switchToBasic = new EventEmitter<void>();

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;

  hasQueryErrors = false;
  queryInputValue: string;
  private editorView: EditorView;

  constructor(
    private queryParser: QueryParserService,
    private queryToApi: QueryToApiService<T>,
    private advancedSearchAutocomplete: AdvancedSearchAutocompleteService<T>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.query && this.editorView) {
      // TODO:
      // this.setEditorContents(this.queryParser.formatFiltersToQuery(this.query, this.properties));
    }
  }

  ngOnInit(): void {
    this.initEditor();
    this.advancedSearchAutocomplete.setProperties(this.properties);
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

    const autocompleteExtension = autocompletion({
      override: [this.advancedSearchAutocomplete.setCompletionSource.bind(this.advancedSearchAutocomplete)],
      icons: false,
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
    this.paramsChange.emit([]);
  }

  private onInputChanged(): void {
    this.queryInputValue = this.editorView.state.doc.toString();
    const parsedQuery = this.queryParser.parseQuery(this.queryInputValue);

    this.hasQueryErrors = Boolean(this.queryInputValue.length && parsedQuery.hasErrors);
    this.cdr.markForCheck();

    if (parsedQuery.hasErrors) {
      // TODO: Handle errors.
      return;
    }

    const filters = this.queryToApi.buildFilters(parsedQuery, this.properties);

    // TODO: Remove before merge
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(filters, null, 2), parsedQuery);
    this.paramsChange.emit(filters);
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
}
