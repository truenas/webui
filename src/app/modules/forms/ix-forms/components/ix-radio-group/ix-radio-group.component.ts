import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { MatRadioChange, MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RadioOption } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
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
    MatRadioButton,
    TooltipComponent,
    IxErrorsComponent,
    AsyncPipe,
    TranslateModule,
    TestOverrideDirective,
    TestDirective,
  ],
})
export class IxRadioGroupComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() options: Observable<RadioOption[]>;
  @Input() inlineFields: boolean;
  @Input() inlineFieldFlex: string;

  isDisabled = false;
  value: string;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  get fieldFlex(): string {
    if (!this.inlineFields) {
      return '100%';
    }

    if (this.inlineFields && this.inlineFieldFlex) {
      return this.inlineFieldFlex;
    }

    return '50%';
  }

  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: string): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  @HostBinding('attr.id') get id(): string {
    return this.controlDirective.name?.toString() || this.label;
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
