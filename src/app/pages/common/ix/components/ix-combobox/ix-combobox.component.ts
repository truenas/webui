import {
  Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NgControl,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-combobox',
  templateUrl: './ix-combobox.component.html',
  styleUrls: ['./ix-combobox.component.scss'],
})
export class IxComboboxComponent implements ControlValueAccessor, OnChanges {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() options: Observable<Option[]>;
  @ViewChild('ixInput') inputElementRef: ElementRef;

  @Input() filter: (options: Option[], filterValue: string) => Observable<Option[]> =
  (options: Option[], value: string): Observable<Option[]> => {
    const filtered = options.filter((option: Option) => {
      return option.label.toLowerCase().includes(value.toLowerCase())
          || option.value.toString().toLowerCase().includes(value.toLowerCase());
    });
    return of(filtered);
  };

  filteredOptions: Observable<Option[]>;

  formControl = new FormControl(this);
  value: string | number = '';
  isDisabled = false;
  filterValue = '';
  selectedOption: Option = null;
  syncOptions: Option[];

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  writeValue(value: string | number): void {
    this.value = value;
    if (this.value && this.syncOptions) {
      this.selectedOption = { ...(this.syncOptions.find((option: Option) => option.value === this.value)) };
    }
    if (this.selectedOption) {
      this.filterValue = this.selectedOption.label;
    }
  }

  onChanged(changedValue: string): void {
    this.filterValue = changedValue;
    if (changedValue) {
      this.filteredOptions = this.filter(this.syncOptions, changedValue);
    } else {
      this.filteredOptions = of(this.syncOptions);
    }
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
    return this.hasValue() && !this.isDisabled;
  }

  hasValue(): boolean {
    return this.filterValue && this.filterValue.length > 0;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
