import { ComponentType } from '@angular/cdk/portal';
import {
  AfterViewInit, Directive, Input, OnInit, ViewChild, inject,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, Subject, map, take,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent } from 'app/modules/ix-forms/components/ix-select/ix-select.component';
import { ChainedSlideInCloseResponse, IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

export const addNewValue = 'ADD_NEW';

@UntilDestroy()
@Directive()
export abstract class IxSelectWithNewOption implements ControlValueAccessor, OnInit, AfterViewInit {
  @Input() disabled: boolean;

  @ViewChild(IxSelectComponent) ixSelect: IxSelectComponent;

  @Input() set value(value: string | number) {
    this.selectValue = value;
    this.notifyValueChange();
  }

  get value(): string | number {
    return this.selectValue;
  }

  options = new Subject<Option[]>();

  onChange: (value: string | number) => void;

  onTouched: () => void;

  private selectValue: string | number;

  notifyValueChange(): void {
    if (this.onChange) {
      this.onChange(this.value);
    }
  }

  writeValue(value: string | number): void {
    this.selectValue = value;
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
    this.fetchUpdatedOptions().pipe(
      map((options) => {
        return [
          { label: this.translateService.instant('Add New'), value: addNewValue } as Option,
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
    result: ChainedSlideInCloseResponse,
    valueSetterCallback: (value: string | number) => void
  ): void;
  abstract getFormComponentType(): ComponentType<unknown>;
  abstract fetchUpdatedOptions(): Observable<Option[]>;

  ngAfterViewInit(): void {
    if (this.ixSelect) {
      this.ixSelect.controlDirective.control.valueChanges.pipe(untilDestroyed(this)).subscribe({
        next: (newValue: number | string) => {
          this.value = newValue;
          if (newValue === addNewValue) {
            const close$ = this.chainedSlideIn.pushComponent(this.getFormComponentType(), false);
            close$.pipe(take(1), untilDestroyed(this)).subscribe({
              next: (response: ChainedSlideInCloseResponse) => {
                if (!response.error) {
                  this.fetchUpdatedOptions().pipe(
                    map((options) => {
                      return [
                        { label: this.translateService.instant('Add New'), value: addNewValue } as Option,
                        ...options,
                      ];
                    }),
                    take(1),
                  ).subscribe({
                    next: (options) => {
                      this.options.next(options);
                    },
                  });
                  this.setValueFromSlideInResult(response, (result) => {
                    this.value = result;
                    this.ixSelect.controlDirective.control.setValue(result);
                  });
                }
              },
            });
          }
        },
      });
    }
  }
}
