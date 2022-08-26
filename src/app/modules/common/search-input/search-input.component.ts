import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener, Input,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'ix-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements OnInit {
  @Input() disabled = false;
  @Input() value = '';
  @Output() search = new EventEmitter<string>();

  @ViewChild('searchInput') input: ElementRef<HTMLInputElement>;

  searchValue = '';

  get shouldShowReset(): boolean {
    return Boolean(this.searchValue);
  }

  ngOnInit(): void {
    this.searchValue = this.value;
  }

  @HostListener('click')
  onHostClicked(): void {
    this.input.nativeElement.focus();
  }

  onResetInput(): void {
    this.updateSearchValue('');
  }

  onInput(value: string): void {
    this.updateSearchValue(value);
  }

  private updateSearchValue(value: string): void {
    this.searchValue = value;
    this.search.emit(value);
  }
}
