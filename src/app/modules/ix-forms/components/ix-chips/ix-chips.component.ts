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
  @Input() autocompleteProvider: ChipsProvider;
  @Input() options: Observable<Option[]>;
  @Input() resolveValue = false;

  @ViewChild('chipInput', { static: true }) chipInput: ElementRef<HTMLInputElement>;

  suggestions$: Observable<string[]>;
  values: string[] = [];
  isDisabled = false;
  private _options: Option[] = [];

  get labels(): string[] {
    if (!this.resolveValue) {
      return this.values;
    }

    return this.values?.map((value) => {
      if (this.resolveValue && this._options?.length) {
        return this._options.find((option) => option.value === parseInt(value))?.label;
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
    if (this.resolveValue && this._options?.length) {
      itemToRemove = this._options.find((option) => option.label === itemToRemove)?.value.toString();
    }
    const updatedValues = this.values.filter((value) => String(value) !== String(itemToRemove));
    this.updateValues(updatedValues);
  }

  onAdd(value: string): void {
    let newValue = (value || '')?.trim();
    if (!newValue || this.values.includes(newValue)) {
      return;
    }

    if (this.resolveValue && this._options?.length) {
      const newOption = this._options.find((option) => option.label === newValue);
      if (newOption) {
        newValue = newOption.value as string;
      }
    }

    this.clearInput();
    this.updateValues([...this.values, newValue]);
  }

  onInputBlur(): void {
    if (!this.allowNewEntries) {
      this.chipInput.nativeElement.value = null;
      return;
    }
    this.onAdd(this.chipInput.nativeElement.value);
  }

  private setOptions(): void {
    if (!this.resolveValue) {
      this.options = null;
      return;
    }

    this.options?.pipe(untilDestroyed(this)).subscribe((options) => {
      this._options = options;
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
