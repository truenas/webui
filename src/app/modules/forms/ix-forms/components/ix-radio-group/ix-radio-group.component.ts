import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatRadioChange, MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RadioOption } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@UntilDestroy()
@Component({
  selector: 'ix-radio-group',
  styleUrls: ['./ix-radio-group.component.scss'],
  templateUrl: './ix-radio-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatRadioGroup,
    ReactiveFormsModule,
    MatRadioButton,
    TooltipComponent,
    IxErrorsComponent,
    AsyncPipe,
    TranslateModule,
    TestOverrideDirective,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxRadioGroupComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly tooltip = input<string>();
  readonly required = input<boolean>();
  readonly options = input<Observable<RadioOption[]>>();
  readonly inlineFields = input<boolean>();
  readonly inlineFieldFlex = input<string>();

  isDisabled = false;
  value: string;

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

  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: string): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onRadiosChanged(event: MatRadioChange): void {
    this.value = event.value as string;
    this.onChange(this.value);
  }
}
