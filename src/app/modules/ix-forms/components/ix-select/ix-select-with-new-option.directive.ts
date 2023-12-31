import { ComponentType } from '@angular/cdk/portal';
import {
  AfterViewInit, Directive, Input, OnInit, ViewChild, inject,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable, distinctUntilChanged, filter, map, switchMap, take, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent } from 'app/modules/ix-forms/components/ix-select/ix-select.component';
import { ChainedComponentResponse, IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

export const addNewIxSelectValue = 'ADD_NEW';

@UntilDestroy()
@Directive()
export abstract class IxSelectWithNewOption implements ControlValueAccessor, OnInit, AfterViewInit {
  @Input() disabled: boolean;
  formComponentIsWide = false;

  @ViewChild(IxSelectComponent) private ixSelect: IxSelectComponent;

  @Input() set value(value: string | number) {
    this.selectValue = value;
    this.ixSelect?.controlDirective.control.setValue(value);
    this.notifyValueChange();
  }

  get value(): string | number {
    return this.selectValue;
  }

  private options = new BehaviorSubject<Option[]>([]);

  onChange: (value: string | number) => void;

  onTouched: () => void;

  private selectValue: string | number;

  private notifyValueChange(): void {
    if (this.onChange) {
      this.onChange(this.value);
    }
  }

  writeValue(value: string | number): void {
    this.selectValue = value;
    this.ixSelect?.controlDirective.control.setValue(value);
  }

  registerOnChange(onChange: (value: unknown) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private chainedSlideIn = inject(IxChainedSlideInService);
  private translateService = inject(TranslateService);

  ngOnInit(): void {
    this.fetchOptions().pipe(
      map((options) => {
        return [
          { label: this.translateService.instant('Add New'), value: addNewIxSelectValue } as Option,
          ...options,
        ];
      }),
      take(1),
      untilDestroyed(this),
    ).subscribe({
      next: (options) => {
        this.options.next(options);
      },
    });
  }

  abstract setValueFromSlideInResult(
    result: ChainedComponentResponse,
  ): void;
  abstract getFormComponentType(): ComponentType<unknown>;
  abstract fetchOptions(): Observable<Option[]>;

  ngAfterViewInit(): void {
    if (!this.ixSelect) {
      return;
    }
    this.ixSelect.options = this.options.asObservable();
    this.ixSelect.ngOnChanges();
    this.ixSelect.controlDirective.control.setValue(this.selectValue);
    this.ixSelect.controlDirective.control.valueChanges.pipe(
      distinctUntilChanged(),
      filter(Boolean),
      tap((newValue: number | string) => this.value = newValue),
      filter((newValue: number | string) => newValue === addNewIxSelectValue),
      switchMap(() => this.chainedSlideIn.pushComponent(this.getFormComponentType(), this.formComponentIsWide)),
      filter((response: ChainedComponentResponse) => !response.error),
      tap((response) => this.setValueFromSlideInResult(response)),
      switchMap(() => this.fetchOptions()),
      tap((options) => this.options.next([
        { label: this.translateService.instant('Add New'), value: addNewIxSelectValue } as Option,
        ...options,
      ])),
      untilDestroyed(this),
    ).subscribe();
  }
}
