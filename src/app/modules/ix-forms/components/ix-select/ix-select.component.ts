import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Input, OnChanges,
} from '@angular/core';
import {
  ControlValueAccessor, UntypedFormControl, NgControl,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EMPTY, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';

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
  @Input() options: Observable<Option[]>;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() multiple: boolean;
  @Input() emptyValue: string = null;
  @Input() hideEmpty = false;

  formControl = new UntypedFormControl(this).value as UntypedFormControl;
  isDisabled = false;
  hasErrorInOptions = false;
  opts$: Observable<Option[]>;
  isLoading = false;

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
}
