import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  input,
  OnInit, Signal, viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';

type InputValue = string | number | null;

@UntilDestroy()
@Component({
  selector: 'ix-field-input',
  templateUrl: './ix-field-input.component.html',
  styleUrls: ['./ix-field-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxLabelComponent,
    IxIconComponent,
    MatInput,
    MatIconButton,
    MatTooltip,
    ReactiveFormsModule,
    MatError,
    IxErrorsComponent,
    MatHint,
    TranslateModule,
    TestOverrideDirective,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxFieldInputComponent implements ControlValueAccessor, OnInit {
  readonly label = input<TranslatedString>();
  readonly placeholder = input<TranslatedString>('');
  readonly prefixIcon = input<MarkedIcon>();
  readonly hint = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly readonly = input<boolean>();
  readonly type = input<string>('text');
  readonly autocomplete = input('off');
  readonly maxLength = input(524288);

  /** If formatted value returned by parseAndFormatInput has non-numeric letters
   * and input 'type' is a number, the input will stay empty on the form */
  readonly format = input<(value: InputValue) => string>();
  readonly parse = input<(value: string | number) => InputValue>();

  readonly inputElementRef: Signal<ElementRef<HTMLInputElement>> = viewChild.required('ixInput', { read: ElementRef });

  private _value: InputValue = this.controlDirective.value as string;
  formatted: string | number | null = '';

  isDisabled = false;
  showPassword = false;
  invalid = false;

  onChange: (value: InputValue) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnInit(): void {
    // No autocomplete initialization needed
  }

  get value(): InputValue {
    return this._value;
  }

  set value(val: InputValue) {
    if (this.type() === 'number') {
      this._value = (val || val === 0) ? Number(val) : null;
      return;
    }
    this._value = val;
  }

  writeValue(value: string | number): void {
    let formatted = value;
    const formatFn = this.format();
    if (value && formatFn) {
      formatted = formatFn(value);
    }
    this.formatted = formatted;
    this.value = value;
  }

  input(ixInput: HTMLInputElement): void {
    this.invalid = ixInput.validity?.badInput;
    const value = ixInput.value;
    this.value = value;
    this.formatted = value;
    const parseFn = this.parse();
    if (value && parseFn) {
      this.value = parseFn(value);
    }
    this.onChange(this.value);
  }

  invalidMessage(): string {
    return this.translate.instant('Value must be a {type}', {
      type: this.type(),
    });
  }

  registerOnChange(onChanged: () => void): void {
    this.onChange = onChanged;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  shouldShowResetInput(): boolean {
    return (
      !this.isDisabled
      && this.hasValue()
      && this.type() !== 'password'
      && !this.readonly()
    );
  }

  getType(): string {
    // Mimicking a password field to prevent browsers from remembering passwords.
    const isFakePassword = this.type() === 'password' && (this.autocomplete() === 'off' || this.showPassword);
    return isFakePassword ? 'text' : this.type();
  }

  isPasswordField(): boolean {
    return this.type() === 'password' && !this.showPassword;
  }

  hasValue(): boolean {
    return this.invalid || Number(this.value?.toString()?.length) > 0;
  }

  resetInput(inputElement: HTMLInputElement): void {
    inputElement.value = '';
    this.invalid = false;
    this.value = '';
    this.formatted = '';
    this.onChange(this.value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  focus(ixInput: HTMLInputElement): void {
    this.onTouch();
    if (this.readonly()) {
      ixInput.select();
    }
  }

  blurred(): void {
    this.onTouch();

    if (this.formatted) {
      const parse = this.parse();
      if (parse) {
        this.value = parse(this.formatted);
        this.formatted = this.value;
      }

      const format = this.format();
      if (format) {
        this.formatted = format(this.value);
      }
    }

    this.cdr.markForCheck();
  }

  onPasswordToggled(): void {
    this.showPassword = !this.showPassword;
  }
}