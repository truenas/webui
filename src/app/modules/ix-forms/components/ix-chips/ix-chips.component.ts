import { ENTER } from '@angular/cdk/keycodes';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  fromEvent, merge, Observable, Subject,
} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, startWith, switchMap,
} from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';

@UntilDestroy()
@Component({
  selector: 'ix-chips',
  templateUrl: './ix-chips.component.html',
  styleUrls: ['./ix-chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxChipsComponent implements OnChanges, ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() allowNewEntries = true;
  /**
   * A function that provides the options for the autocomplete dropdown.
   * This function is called when the user types into the input field,
   * and it should return an Observable that emits an array of options.
   * Each option is an object with a `value` and `label` property.
   * The component uses these options to suggest possible completions to the user.
   */
  @Input() autocompleteProvider: ChipsProvider;
  /**
   * Determines whether the component should resolve labels instead of values.
   * If set to true, the component will perform a lookup to find the corresponding label for a value.
   * This is useful when the component is used with a set of predefined options,
   * and you want to display the label of an option instead of its value.
   */
  @Input() resolveValue = false;
  /**
   * An Observable that emits an array of options for label resolution.
   * Each option is an object with a `value` and `label` property.
   * The component uses these options to map values to their corresponding labels when `resolveValue` is set to true.
   * This is useful when the component is used with a set of predefined options,
   * and you want to display the label of an option instead of its value.
   */
  @Input() resolveOptions: Observable<Option[]>;
  private resolvedOptions: Option[] = [];

  @ViewChild('chipInput', { static: true }) chipInput: ElementRef<HTMLInputElement>;

  suggestions$: Observable<string[]>;
  values: string[] = [];
  isDisabled = false;

  get labels(): string[] {
    if (!this.resolveValue) {
      return this.values;
    }

    return this.values?.map((value) => {
      if (this.resolvedOptions?.length) {
        return this.resolvedOptions.find((option) => option.value === parseInt(value))?.label;
      }
      return value;
    }).filter(Boolean);
  }

  inputReset$ = new Subject<void>();

  onChange: (value: string[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  readonly separatorKeysCodes = [ENTER];

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnChanges(): void {
    this.setAutocomplete();
    this.setOptions();
  }

  writeValue(value: string[]): void {
    this.values = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: []) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onRemove(itemToRemove: string): void {
    if (this.resolveValue && this.resolvedOptions?.length) {
      itemToRemove = this.resolvedOptions.find((option) => option.label === itemToRemove)?.value.toString();
    }
    const updatedValues = this.values.filter((value) => String(value) !== String(itemToRemove));
    this.updateValues(updatedValues);
  }

  onAdd(value: string): void {
    let newValue = (value || '')?.trim();
    if (!newValue || this.values.includes(newValue)) {
      return;
    }

    if (this.resolveValue && this.resolvedOptions?.length) {
      const newOption = this.resolvedOptions.find((option) => option.label === newValue);
      if (newOption) {
        newValue = newOption.value as string;
      } else {
        // Do not allow to add string values for number arrays
        return;
      }
    }

    this.clearInput();
    this.updateValues([...this.values, newValue]);
  }

  onInputBlur(): void {
    if (!this.allowNewEntries || this.resolveValue) {
      this.chipInput.nativeElement.value = null;
      return;
    }
    this.onAdd(this.chipInput.nativeElement.value);
  }

  private setOptions(): void {
    if (!this.resolveValue) {
      this.resolvedOptions = null;
      return;
    }

    this.resolveOptions?.pipe(untilDestroyed(this)).subscribe((options) => {
      this.resolvedOptions = options;
    });
  }

  private setAutocomplete(): void {
    if (!this.autocompleteProvider) {
      this.suggestions$ = null;
      return;
    }

    this.suggestions$ = merge(
      fromEvent(this.chipInput.nativeElement, 'input')
        .pipe(
          startWith(''),
          debounceTime(100),
          distinctUntilChanged(),
        ),
      this.inputReset$,
    ).pipe(
      switchMap(() => {
        return this.autocompleteProvider(this.chipInput.nativeElement.value);
      }),
    );
  }

  private updateValues(updatedValues: string[]): void {
    this.values = updatedValues;
    this.onChange(this.values);
    this.onTouch();
  }

  private clearInput(): void {
    this.chipInput.nativeElement.value = '';
    this.inputReset$.next();
  }
}
