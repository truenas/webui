import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild,
} from '@angular/core';
import { SearchQuery } from 'app/modules/search-input/types/search-query.interface';

@Component({
  selector: 'ix-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicSearchComponent implements AfterViewInit {
  @Input() query: string;
  @Input() allowAdvanced = false;

  @Output() switchToAdvanced = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<string>();
  @Output() runSearch = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<SearchQuery<never>>();

  @ViewChild('searchControl') searchControl: ElementRef;

  ngAfterViewInit(): void {
    (this.searchControl?.nativeElement as HTMLInputElement)?.focus();
  }

  protected resetInput(): void {
    this.query = '';
    this.resetFilters.emit({ query: '', isBasicQuery: true });
  }
}
