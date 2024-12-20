import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-textarea',
  templateUrl: './ix-textarea.component.html',
  styleUrls: ['./ix-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatInput,
    FormsModule,
    IxErrorsComponent,
    ReactiveFormsModule,
    MatHint,
    TestDirective,
    TestOverrideDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxTextareaComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly placeholder = input<string>();
  readonly hint = input<string>();
  readonly tooltip = input<string>();
  readonly required = input<boolean>();
  readonly rows = input(4);
  readonly readonly = input<boolean>();

  value = '';
  isDisabled = false;

  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

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

  resetInput(): void {
    this.value = '';
    this.onChange('');
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }
}
