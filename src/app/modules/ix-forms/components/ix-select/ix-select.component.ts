import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Input, OnChanges,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SelectOption, SelectOptionValueType } from 'app/interfaces/option.interface';

type IxSelectValue = SelectOptionValueType;

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() label: string;
  @Input() value: IxSelectValue;
  @Input() hint: string;
  @Input() options: Observable<SelectOption[]>;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() multiple: boolean;
  @Input() emptyValue: string = null;
  @Input() hideEmpty = false;
  @Input() compareWith: (val1: unknown, val2: unknown) => boolean = (val1: unknown, val2: unknown) => val1 === val2;

  isDisabled = false;
  hasErrorInOptions = false;
  opts$: Observable<SelectOption[]>;
  isLoading = false;
  private opts: SelectOption[] = [];

  get selectedLabel(): string {
    if (this.value === undefined) {
      return '';
    }

    if (this.multiple) {
      return this.multipleLabels.join(',');
    }

    const selectedOption = this.opts.find((opt) => this.compareWith(opt.value, this.value));
    return selectedOption ? selectedOption.label : '';
  }

  get multipleLabels(): string[] {
    const selectedLabels: string[] = [];
    this.opts.forEach((opt) => {
      if (Array.isArray(this.value) && this.value.some((val) => val === opt.value)) {
        selectedLabels.push(` ${opt.label}`);
      }
    });
    return selectedLabels.length > 0 ? selectedLabels : [];
  }

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
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
