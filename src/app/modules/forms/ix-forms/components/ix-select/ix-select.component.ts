import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, Observable } from 'rxjs';
import { catchError, debounceTime, tap } from 'rxjs/operators';
import { SelectOption, SelectOptionValueType } from 'app/interfaces/option.interface';

export type IxSelectValue = SelectOptionValueType;

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() label: string;
  @Input() hint: string;
  @Input() options: Observable<SelectOption[]>;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() multiple: boolean;
  @Input() emptyValue: string = null;
  @Input() hideEmpty = false;
  @Input() showSelectAll = false;
  @Input() compareWith: (val1: unknown, val2: unknown) => boolean = (val1: unknown, val2: unknown) => val1 === val2;

  protected value: IxSelectValue;
  protected isDisabled = false;
  protected hasErrorInOptions = false;
  protected opts$: Observable<SelectOption[]>;
  protected isLoading = false;

  protected selectAllState = {
    checked: false,
  };

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

  get disabledState(): boolean {
    return this.isDisabled || !this.options;
  }

  get isLoadingState(): boolean {
    return this.isLoading || !this.options;
  }

  constructor(public controlDirective: NgControl, private cdr: ChangeDetectorRef) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnChanges(): void {
    if (!this.options) {
      this.hasErrorInOptions = true;
    } else {
      this.hasErrorInOptions = false;
      this.isLoading = true;
      this.opts$ = this.options.pipe(
        catchError((error: unknown) => {
          console.error(error);
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

  ngOnInit(): void {
    if (this.multiple) {
      this.controlDirective.control.valueChanges.pipe(debounceTime(0), untilDestroyed(this)).subscribe(() => {
        this.updateSelectAllState();
        this.cdr.markForCheck();
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

  selectAll(): void {
    if (this.multiple) {
      this.value = this.opts.map((opt) => opt.value) as SelectOptionValueType;
      this.onChange(this.value);
    }
  }

  unselectAll(): void {
    this.value = [];
    this.onChange(this.value);
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectAll();
    } else {
      this.unselectAll();
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    if (Array.isArray(this.value)) {
      if (this.value.length === 0) {
        this.selectAllState.checked = false;
      } else if (this.value.length === this.opts.length) {
        this.selectAllState.checked = true;
      } else {
        this.selectAllState.checked = false;
      }
    }
  }
}
