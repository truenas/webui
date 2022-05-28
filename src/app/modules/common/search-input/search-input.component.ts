import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener, Input,
  Output,
  ViewChild,
} from '@angular/core';

// TODO: Fix breadcrumbs

@Component({
  selector: 'ix-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  @Input() disabled = false;
  @Output() search = new EventEmitter<string>();

  @ViewChild('searchInput') input: ElementRef<HTMLInputElement>;

  searchValue = '';

  get shouldShowReset(): boolean {
    return Boolean(this.searchValue);
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
