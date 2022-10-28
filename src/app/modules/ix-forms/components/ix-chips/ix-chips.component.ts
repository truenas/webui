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
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  fromEvent, merge, Observable, Subject,
} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, startWith, switchMap,
} from 'rxjs/operators';
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
  @Input() autocompleteProvider: ChipsProvider;

  @ViewChild('chipInput', { static: true }) chipInput: ElementRef<HTMLInputElement>;

  suggestions$: Observable<string[]>;
  values: string[] = [];
  isDisabled = false;

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
    const updatedValues = this.values.filter((value) => value !== itemToRemove);
    this.updateValues(updatedValues);
  }

  onAdd(value: string): void {
    const newValue = (value || '').trim();
    if (!newValue || this.values.includes(newValue)) {
      return;
    }

    this.clearInput();
    this.updateValues([...this.values, newValue]);
  }

  /**
   * Adding chips on blur manually instead of [matChipInputAddOnBlur] to support autocomplete.
   */
  onInputBlur(event: FocusEvent): void {
    const target: HTMLElement = event.relatedTarget as HTMLElement;
    if (target?.tagName === 'MAT-OPTION') {
      return;
    }

    this.onAdd(this.chipInput.nativeElement.value);
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
    this.onChange(updatedValues);
    this.onTouch();
  }

  private clearInput(): void {
    this.chipInput.nativeElement.value = '';
    this.inputReset$.next();
  }
}
