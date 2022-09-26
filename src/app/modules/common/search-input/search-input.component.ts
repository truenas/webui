import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener, Input,
  Output,
  ViewChild,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'ix-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements OnInit, OnChanges {
  @Input() disabled = false;
  @Input() value = '';
  @Output() search = new EventEmitter<string>();

  @ViewChild('ixSearchInput') input: ElementRef<HTMLInputElement>;

  @HostListener('click')
  onHostClicked(): void {
    this.input.nativeElement.focus();
  }

  searchValue = '';
  searchValueEmitHandler = new Subject<string>();

  ngOnInit(): void {
    this.searchValue = this.value;
    this.handleSearchValueChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.disabled.previousValue !== changes.disabled.currentValue && !!this.searchValue) {
      this.updateSearchValue(this.searchValue);
    }
  }

  onResetInput(): void {
    this.updateSearchValue('');
  }

  onInput(value: string): void {
    this.updateSearchValue(value);
  }

  private handleSearchValueChanges(): void {
    this.searchValueEmitHandler.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((value: string) => {
      this.search.emit(value);
    });
  }

  private updateSearchValue(value: string): void {
    this.searchValue = value;
    this.searchValueEmitHandler.next(value);
  }
}
