import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, input,
} from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleChange, MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatHint } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-button-group',
  templateUrl: './ix-button-group.component.html',
  styleUrls: ['./ix-button-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
    IxErrorsComponent,
    MatHint,
    ReactiveFormsModule,
    AsyncPipe,
    TranslateModule,
    TestDirective,
    TestOverrideDirective,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxButtonGroupComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly hint = input<string>();
  readonly tooltip = input<string>();
  readonly required = input<boolean>();
  readonly options = input<Observable<Option[]>>();
  readonly vertical = input(false);
  readonly inlineFields = input(false);

  @HostBinding('class.inlineFields')
  get inlineFieldsClass(): boolean {
    return this.inlineFields();
  }

  isDisabled = false;
  value: string;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

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

  onValueChanged(event: MatButtonToggleChange): void {
    this.value = event.value as string;
    this.onChange(this.value);
  }
}
