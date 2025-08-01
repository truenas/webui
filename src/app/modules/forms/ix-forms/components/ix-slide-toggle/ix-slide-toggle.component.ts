import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, inject } from '@angular/core';
import {
  ControlValueAccessor, NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSlideToggleChange, MatSlideToggle } from '@angular/material/slide-toggle';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@UntilDestroy()
@Component({
  selector: 'ix-slide-toggle',
  styleUrls: ['./ix-slide-toggle.component.scss'],
  templateUrl: './ix-slide-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSlideToggle,
    TooltipComponent,
    IxErrorsComponent,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxSlideToggleComponent implements ControlValueAccessor {
  controlDirective = inject(NgControl);
  private cdr = inject(ChangeDetectorRef);

  readonly label = input<string>();
  readonly tooltip = input<string>();
  readonly required = input<boolean>();

  isDisabled = false;
  value: boolean;

  constructor() {
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

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onSlideToggleChanged(event: MatSlideToggleChange): void {
    this.value = event.checked;
    this.onChange(event.checked);
  }
}
