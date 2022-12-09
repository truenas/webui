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
import { Option, SelectOption } from 'app/interfaces/option.interface';

type IxSelectValue = string | number | string[] | number[];

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

  isDisabled = false;
  hasErrorInOptions = false;
  opts$: Observable<SelectOption[]>;
  isLoading = false;
  private opts: Option[] = [];

  get multipleLabels(): string[] {
    const selectedLabels: string[] = [];
    this.opts.forEach((opt) => {
      if (Array.isArray(this.value)) {
        if (this.value.some((val) => val === opt.value)) {
          selectedLabels.push(` ${opt.label}`);
        }
      } else {
        return null;
      }
    });
    return selectedLabels.length > 0 ? selectedLabels : null;
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

  get disabledState(): boolean {
    return this.isDisabled || !this.options;
  }

  get isLoadingState(): boolean {
    return this.isLoading || !this.options;
  }
}
