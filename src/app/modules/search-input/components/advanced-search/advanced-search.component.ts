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
import { closeBrackets } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
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

  protected onResetInput(): void {
    this.setEditorContents('');
    this.queryChange.emit([]);
  }

  private initEditor(): void {
    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      this.onInputChanged();
    });

    this.editorView = new EditorView({
      extensions: [
        EditorView.lineWrapping,
        updateListener,
        closeBrackets(),
      ],
      // doc: this.queryParser.formatFiltersToQuery(this.query, this.properties),
    });
    this.inputArea.nativeElement.append(this.editorView.dom);
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
}
