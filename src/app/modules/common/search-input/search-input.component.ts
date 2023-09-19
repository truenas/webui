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
  HostBinding,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

@UntilDestroy()
@Component({
  selector: 'ix-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements OnInit, OnChanges {
  @HostBinding('class.disabled')
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

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.disabled?.previousValue !== changes.disabled?.currentValue && !!this.searchValue) {
      this.updateSearchValue(this.searchValue);
    }

    if (changes.value?.previousValue !== changes.value?.currentValue) {
      this.searchValue = changes.value.currentValue;
    }
  }

  ngOnInit(): void {
    this.searchValue = this.value;
    this.handleSearchValueChanges();
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
