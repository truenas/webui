import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { MatHint } from '@angular/material/form-field';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@UntilDestroy()
@Component({
  selector: 'ix-checkbox',
  styleUrls: ['./ix-checkbox.component.scss'],
  templateUrl: './ix-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCheckbox,
    TooltipComponent,
    WarningComponent,
    IxErrorsComponent,
    ReactiveFormsModule,
    MatHint,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxCheckboxComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly hint = input<string>();
  readonly tooltip = input<string>();
  readonly warning = input<string>();
  readonly required = input<boolean>();

  isDisabled = false;
  value: boolean;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: boolean) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: boolean): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: boolean) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onCheckboxChanged(event: MatCheckboxChange): void {
    this.value = event.checked;
    this.onChange(event.checked);
  }
}
