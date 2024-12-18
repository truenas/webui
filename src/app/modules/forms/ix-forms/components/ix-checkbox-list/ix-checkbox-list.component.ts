import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-checkbox-list',
  templateUrl: './ix-checkbox-list.component.html',
  styleUrls: ['./ix-checkbox-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatCheckbox,
    IxErrorsComponent,
    ReactiveFormsModule,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxCheckboxListComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly tooltip = input<string>();
  readonly required = input<boolean>();
  readonly options = input<Observable<Option[]>>();
  readonly inlineFields = input<boolean>();
  readonly inlineFieldFlex = input<string>();

  isDisabled = false;
  value: (string | number)[];

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  protected fieldFlex = computed(() => {
    if (!this.inlineFields()) {
      return '100%';
    }

    if (this.inlineFields() && this.inlineFieldFlex()) {
      return this.inlineFieldFlex();
    }

    return '50%';
  });

  onChange: (value: (string | number)[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: (string | number)[]): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: (string | number)[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  isChecked(value: string | number): boolean {
    return this.value.includes(value);
  }

  onCheckboxChanged(value: string | number): void {
    if (this.isChecked(value)) {
      this.value = this.value.filter((item) => item !== value);
    } else {
      this.value = [...this.value, value];
    }

    this.onChange(this.value);
  }
}
