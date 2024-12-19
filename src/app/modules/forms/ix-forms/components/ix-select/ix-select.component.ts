import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, input, model, OnChanges, OnInit,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatHint } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, debounceTime, tap } from 'rxjs/operators';
import { SelectOption, SelectOptionValueType } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

export type IxSelectValue = SelectOptionValueType;

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatSelect,
    FormsModule,
    MatSelectTrigger,
    IxIconComponent,
    ReactiveFormsModule,
    MatOption,
    MatTooltip,
    TooltipComponent,
    MatProgressSpinner,
    IxErrorsComponent,
    MatHint,
    AsyncPipe,
    TranslateModule,
    TestDirective,
    TestOverrideDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
  readonly label = input<string>();
  readonly hint = input<string>();
  readonly options = model<Observable<SelectOption[]>>();
  readonly required = input<boolean>();
  readonly tooltip = input<string>();
  readonly multiple = input<boolean>();
  readonly emptyValue = input<string>(null);
  readonly hideEmpty = input(false);
  readonly showSelectAll = input(false);
  readonly compareWith = input<(val1: unknown, val2: unknown) => boolean>((val1, val2) => val1 === val2);

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

    if (this.multiple()) {
      return this.multipleLabels.join(',');
    }

    const selectedOption = this.opts.find((opt) => this.compareWith()(opt.value, this.value));
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
    return this.isDisabled || !this.options();
  }

  get isLoadingState(): boolean {
    return this.isLoading || !this.options();
  }

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnChanges(): void {
    if (!this.options()) {
      this.hasErrorInOptions = true;
    } else {
      this.hasErrorInOptions = false;
      this.isLoading = true;
      this.opts$ = this.options().pipe(
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
    if (this.multiple()) {
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
    if (this.multiple()) {
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
