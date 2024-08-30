import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IconGroupOption } from 'app/modules/forms/ix-forms/components/ix-icon-group/icon-group-option.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@UntilDestroy()
@Component({
  selector: 'ix-icon-group',
  templateUrl: './ix-icon-group.component.html',
  styleUrls: ['./ix-icon-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatIconButton,
    TestIdModule,
    IxIconModule,
    IxErrorsComponent,
    TranslateModule,
  ],
})
export class IxIconGroupComponent implements ControlValueAccessor {
  readonly options = input.required<IconGroupOption[]>();
  readonly label = input<string>();
  readonly tooltip = input<string>();
  readonly required = input<boolean>();

  protected isDisabled = false;
  protected value: IconGroupOption['value'];

  constructor(
    protected controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  protected onChange: (value: IconGroupOption['value']) => void = (): void => {};
  protected onTouch: () => void = (): void => {};

  writeValue(value: IconGroupOption['value']): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: IconGroupOption['value']) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  protected onValueChanged(value: IconGroupOption['value']): void {
    this.writeValue(value);
    this.onChange(this.value);
  }
}
