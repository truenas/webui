import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild,
} from '@angular/core';

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

  @ViewChild('searchControl') searchControl: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    this.focusInput();
  }

  protected resetInput(): void {
    this.query = '';
    this.queryChange.emit(this.query);
    this.runSearch.emit();
    this.focusInput();
  }

  private focusInput(): void {
    this.searchControl?.nativeElement?.focus();
  }
}
