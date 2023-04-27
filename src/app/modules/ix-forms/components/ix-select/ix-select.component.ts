import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, debounceTime, scan, tap,
} from 'rxjs/operators';
import { SelectOption, SelectOptionValueType } from 'app/interfaces/option.interface';

type IxSelectValue = SelectOptionValueType;

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxSelectComponent implements ControlValueAccessor, OnChanges, AfterViewInit {
  @Input() label: string;
  @Input() value: IxSelectValue;
  @Input() hint: string;
  @Input() options: Observable<SelectOption[]>;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() ordered: boolean;
  @Input() multiple: boolean;
  @Input() emptyValue: string = null;
  @Input() hideEmpty = false;

  @ViewChild('matSelect') matSelect: MatSelect;

  isDisabled = false;
  hasErrorInOptions = false;
  opts$: Observable<SelectOption[]>;
  isLoading = false;
  private opts: SelectOption[] = [];

  get multipleLabels(): string[] {
    const selectedLabels: string[] = [];
    if (this.multiple && this.ordered) {
      (Array.isArray(this.value) ? this.value : []).forEach((val) => {
        if (this.opts.some((opt) => opt.value === val)) {
          selectedLabels.push(` ${this.opts.find((opt) => opt.value === val).label}`);
        }
      });
    } else {
      this.opts.forEach((opt) => {
        if (Array.isArray(this.value) && this.value.some((val) => val === opt.value)) {
          selectedLabels.push(` ${opt.label}`);
        }
      });
    }
    return selectedLabels.length > 0 ? selectedLabels : null;
  }

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngAfterViewInit(): void {
    if (this.multiple) {
      this.matSelect.optionSelectionChanges.pipe(
        debounceTime(0),
        scan((acc, change) => {
          if (change.source.selected) {
            return acc.includes(change.source.value) ? acc : [...acc, change.source.value];
          }
          return acc.filter((entry) => entry !== change.source.value);
        }, this.value as (string | number)[]),
        untilDestroyed(this),
      ).subscribe((selectedValues) => {
        if (this.ordered) {
          this.writeValue(selectedValues);
          this.onChange(selectedValues);
        }
      });
    }
  }

  ngOnChanges(): void {
    if (!this.options) {
      this.hasErrorInOptions = true;
    } else {
      this.hasErrorInOptions = false;
      this.isLoading = true;
      this.opts$ = this.options.pipe(
        catchError(() => {
          this.hasErrorInOptions = true;
          return EMPTY;
        }),
        tap(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      );

      this.opts$.pipe(untilDestroyed(this)).subscribe((opts) => {
        this.opts = opts;
      });
    }
  }

  onChange: (value: IxSelectValue) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(val: IxSelectValue): void {
    this.value = val;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: IxSelectValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onOptionTooltipClicked(event: MouseEvent): void {
    event.stopPropagation();
  }

  get disabledState(): boolean {
    return this.isDisabled || !this.options;
  }

  get isLoadingState(): boolean {
    return this.isLoading || !this.options;
  }
}
