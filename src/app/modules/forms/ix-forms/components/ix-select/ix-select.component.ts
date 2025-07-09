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
import { EMPTY, Observable, Subscription } from 'rxjs';
import { catchError, debounceTime, tap } from 'rxjs/operators';
import { SelectOption, SelectOptionValueType } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export type IxSelectValue = SelectOptionValueType;

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly label = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly options = model<Observable<SelectOption[]>>();
  readonly required = input<boolean>(false);
  readonly tooltip = input<TranslatedString>();
  readonly multiple = input<boolean>();
  readonly emptyValue = input<string | null>(null);
  readonly emptyLabel = input('--');
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
  private optsSubscription: Subscription;

  get selectedLabel(): string {
    if (this.value === undefined) {
      return this.emptyLabel();
    }

    if (this.multiple()) {
      return this.multipleLabels.join(',');
    }

    const selectedOption = this.opts.find((opt) => this.compareWith()(opt.value, this.value));
    return selectedOption ? selectedOption.label : this.emptyLabel();
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

  ngOnChanges(changes: IxSimpleChanges<IxSelectComponent>): void {
    if ('options' in changes) {
      this.refreshOptions();
    }
  }

  ngOnInit(): void {
    if (this.multiple()) {
      this.controlDirective.control?.valueChanges?.pipe(debounceTime(0), untilDestroyed(this)).subscribe(() => {
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

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  refreshOptions(): void {
    const options$ = this.options();
    if (!options$) {
      this.hasErrorInOptions = true;
    } else {
      this.hasErrorInOptions = false;
      this.isLoading = true;
      this.opts$ = options$.pipe(
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

      this.optsSubscription?.unsubscribe();
      this.optsSubscription = this.opts$.pipe(untilDestroyed(this)).subscribe((opts) => {
        this.opts = opts;

        // Auto-select the first option for empty required selects
        if (!this.value && this.required && this.opts.length > 0 && !this.multiple()) {
          this.value = opts[0].value;
          this.onChange(this.value);
        }
      });
    }
  }

  private selectAll(): void {
    if (this.multiple()) {
      this.value = this.opts.map((opt) => opt.value) as SelectOptionValueType;
      this.onChange(this.value);
    }
  }

  private unselectAll(): void {
    this.value = [];
    this.onChange(this.value);
  }

  protected toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectAll();
    } else {
      this.unselectAll();
    }
    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
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
