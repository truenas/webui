import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SearchQueryService } from 'app/modules/search-input/services/search-query.service';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

@Component({
  selector: 'ix-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent<T> implements OnChanges {
  @Input() query: QueryFilters<T> = [];
  @Input() properties: SearchProperty<T>[] = [];

  @Output() queryChange = new EventEmitter<QueryFilters<T>>();
  @Output() switchToBasic = new EventEmitter<void>();

  @ViewChild('inputArea', { static: true }) inputArea: ElementRef<HTMLElement>;

  constructor(
    private queryParser: SearchQueryService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.query) {
      // TODO: Temporary
      this.inputArea.nativeElement.textContent = this.queryParser.formatFiltersToQuery(this.query, this.properties);
    }
  }

  protected onInput(queryText: string): void {
    const query = this.queryParser.parseTextToFilters(queryText, this.properties);
    this.queryChange.emit(query);
  }

  protected onResetInput(): void {
    this.inputArea.nativeElement.textContent = '';
    this.queryChange.emit([]);
  }
}
