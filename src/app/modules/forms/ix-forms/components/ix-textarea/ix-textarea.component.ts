import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl, FormsModule } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MatHint } from '@angular/material/form-field';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { MatInput } from '@angular/material/input';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';

@UntilDestroy()
@Component({
  selector: 'ix-textarea',
  templateUrl: './ix-textarea.component.html',
  styleUrls: ['./ix-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    TestIdModule,
    MatInput,
    FormsModule,
    IxErrorsComponent,
    MatHint,
  ],
})
export class IxTextareaComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() rows = 4;
  @Input() readonly: boolean;

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
