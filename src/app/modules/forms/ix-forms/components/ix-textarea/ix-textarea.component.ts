import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, inject } from '@angular/core';
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
import { TranslatedString } from 'app/modules/translate/translate.helper';

@UntilDestroy()
@Component({
  selector: 'ix-textarea',
  templateUrl: './ix-textarea.component.html',
  styleUrls: ['./ix-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  controlDirective = inject(NgControl);
  private cdr = inject(ChangeDetectorRef);

  readonly label = input<TranslatedString>();
  readonly placeholder = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly rows = input(4);
  readonly readonly = input<boolean>();

  value = '';
  isDisabled = false;

  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor() {
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

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }
}
