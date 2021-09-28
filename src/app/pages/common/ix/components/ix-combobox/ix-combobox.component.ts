import {
  Component, ElementRef, EventEmitter, forwardRef, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  fromEvent, Observable, of, Subject,
} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, map, takeUntil,
} from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-combobox',
  templateUrl: './ix-combobox.component.html',
  styleUrls: ['./ix-combobox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IxComboboxComponent),
      multi: true,
    },
  ],
})
export class IxComboboxComponent implements ControlValueAccessor, OnChanges, OnInit {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() options: Observable<Option[]>;
  @ViewChild('ixInput') inputElementRef: ElementRef;
  @ViewChild('auto') autoCompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  @Output() scrollEnd: EventEmitter<string> = new EventEmitter<string>();

  @Input() filter: (options: Option[], filterValue: string) => Observable<Option[]> =
  (options: Option[], value: string): Observable<Option[]> => {
    const filtered = options.filter((option: Option) => {
      return option.label.toLowerCase().includes(value.toLowerCase())
          || option.value.toString().toLowerCase().includes(value.toLowerCase());
    });
    return of(filtered);
  };

  filteredOptions: Observable<Option[]>;
  filterChanged$ = new Subject<string>();
  formControl = new FormControl(this);
  value: string | number = '';
  filterValue = '';
  touched = false;
  selectedOption: Option = null;
  syncOptions: Option[];

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: string | number): void {
    this.value = value;
    if (this.value && this.syncOptions) {
      this.selectedOption = { ...(this.syncOptions.find((option: Option) => option.value === this.value)) };
    }
    if (this.selectedOption) {
      this.filterValue = this.selectedOption.label;
    }
  }

  ngOnInit(): void {
    this.filterChanged$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((changedValue: string) => {
      this.filterValue = changedValue;
      if (changedValue) {
        this.filteredOptions = this.filter(this.syncOptions, changedValue);
      } else {
        this.filteredOptions = of(this.syncOptions);
      }
    });
  }

  onOpenDropdown(): void {
    setTimeout(() => {
      if (
        this.autoCompleteRef
        && this.autocompleteTrigger
        && this.autoCompleteRef.panel
      ) {
        fromEvent(this.autoCompleteRef.panel.nativeElement, 'scroll')
          .pipe(
            map(() => this.autoCompleteRef.panel.nativeElement.scrollTop),
            takeUntil(this.autocompleteTrigger.panelClosingActions),
            untilDestroyed(this),
          )
          .subscribe(() => {
            const scrollTop = this.autoCompleteRef.panel.nativeElement
              .scrollTop;
            const scrollHeight = this.autoCompleteRef.panel.nativeElement
              .scrollHeight;
            const elementHeight = this.autoCompleteRef.panel.nativeElement
              .clientHeight;
            const atBottom = scrollHeight === scrollTop + elementHeight;
            if (atBottom) {
              this.scrollEnd.emit(this.filterValue);
            }
          });
      }
    });
  }

  onChanged(changedValue: string): void {
    this.filterChanged$.next(changedValue);
  }

  resetInput(): void {
    this.filterValue = '';
    this.inputElementRef.nativeElement.value = '';
    this.selectedOption = null;
    this.onChange('');
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  optionSelected(option: Option): void {
    this.selectedOption = { ...option };
    this.filterValue = this.selectedOption.label;
    this.onChange(this.selectedOption.value);
  }

  displayWith(): string {
    return this.selectedOption ? this.selectedOption.label : '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      if (changes.options.currentValue) {
        changes.options.currentValue.pipe(untilDestroyed(this)).subscribe((options: Option[]) => {
          this.syncOptions = options;
          this.filteredOptions = of(options);
          this.selectedOption = { ...(this.syncOptions.find((option: Option) => option.value === this.value)) };
          if (this.selectedOption) {
            this.filterValue = this.selectedOption.label;
          }
        });
      }
    }
  }

  shouldShowResetInput(): boolean {
    return this.hasValue();
  }

  hasValue(): boolean {
    return this.filterValue && this.filterValue.length > 0;
  }
}
