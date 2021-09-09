import {
  Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-combobox',
  templateUrl: './ix-combobox.component.html',
  styleUrls: ['./ix-combobox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IxCombobox),
      multi: true,
    },
  ],
})
export class IxCombobox implements ControlValueAccessor, OnInit, OnChanges {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() options: Observable<Option[]>;

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
  value = '';
  touched = false;
  selectedOption: Option = null;
  syncOptions: Option[];

  onChange: (value: string | number) => void = (): void => {};
  onTouched: () => void = (): void => {};

  writeValue(value: string): void {
    this.value = value;
    if (this.value && this.syncOptions) {
      this.selectedOption = { ...(this.syncOptions.find((option: Option) => option.value === this.value)) };
    }
    this.onChange(value);
    this.onTouched();
  }

  onChanged(changedValue: string): void {
    if (changedValue) {
      this.filteredOptions = this.filter(this.syncOptions, changedValue);
    } else {
      this.filteredOptions = of(this.syncOptions);
    }
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }

  optionSelected(option: Option): void {
    if (!this.selectedOption) {
      this.selectedOption = new Option();
    }
    this.selectedOption.label = option.label;
    this.selectedOption.value = option.value;
    this.onChange(option.value);
  }

  displayWith(): string {
    if (this.selectedOption) {
      return this.selectedOption.label;
    }
  }

  ngOnInit(): void {
    this.filteredOptions = this.options;
    this.options?.pipe(untilDestroyed(this)).subscribe((options: Option[]) => {
      this.syncOptions = options;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      if (changes.options.currentValue) {
        this.filteredOptions = changes.options.currentValue;
        changes.options.currentValue.pipe(untilDestroyed(this)).subscribe((options: Option[]) => {
          this.syncOptions = options;
          this.selectedOption = { ...(this.syncOptions.find((option: Option) => option.value === this.value)) };
        });
      }
    }
  }
}
