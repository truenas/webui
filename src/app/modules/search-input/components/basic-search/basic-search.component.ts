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
  @Output() runSearch = new EventEmitter<SearchQuery<never> | void>();

  @ViewChild('searchControl') searchControl: ElementRef;

  ngAfterViewInit(): void {
    this.focusInput();
  }

  protected resetInput(): void {
    this.query = '';
    this.runSearch.emit({ query: '', isBasicQuery: true });
    this.focusInput();
  }

  private focusInput(): void {
    (this.searchControl?.nativeElement as HTMLInputElement)?.focus();
  }
}
