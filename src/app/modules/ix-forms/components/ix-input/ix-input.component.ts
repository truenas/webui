import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormControl,
  NgControl,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  templateUrl: './ix-input.component.html',
  styleUrls: ['./ix-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxInputComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() prefixIcon: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() readonly: boolean;
  @Input() type: string;
  @Input() autocomplete = 'off';

  /**
   * @deprecated Avoid using. Use valueChanges.
   */
  @Output() inputBlur: EventEmitter<unknown> = new EventEmitter();

  /** If formatted value returned by parseAndFormatInput has non-numeric letters
   * and input 'type' is a number, the input will stay empty on the form */
  @Input() format: (value: string | number) => string;
  @Input() parse: (value: string | number) => string | number;

  formControl = new UntypedFormControl(this).value as UntypedFormControl;

  private _value: string | number = '';
  formatted: string | number = '';

  isDisabled = false;
  showPassword = false;
  invalid = false;

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  get value(): string | number {
    return this._value;
  }

  set value(val: string | number) {
    if (this.type === 'number') {
      this._value = val ? Number(val) : null;
      return;
    }
    this._value = val;
  }

  writeValue(value: string | number): void {
    let formatted = value;
    if (value) {
      if (this.format) {
        formatted = this.format(value);
      }
    }
    this.formatted = formatted;
    this.value = value;
  }

  input(ixInput: HTMLInputElement): void {
    this.invalid = ixInput.validity?.badInput;
    const value = ixInput.value;
    this.value = value;
    this.formatted = value;
    if (this.parse && !!value) {
      this.value = this.parse(value);
    }
    this.onChange(this.value);
  }

  invalidMessage(): string {
    return this.translate.instant('Value must be a {type}', {
      type: this.type,
    });
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  shouldShowResetInput(): boolean {
    return (
      !this.isDisabled
      && this.hasValue()
      && this.type !== 'password'
      && !this.readonly
    );
  }

  getType(): string {
    return this.type === 'password' ? 'search' : this.type;
  }

  isPasswordField(): boolean {
    return this.type === 'password' && !this.showPassword;
  }

  hasValue(): boolean {
    return this.invalid || (this.value && this.value.toString().length > 0);
  }

  resetInput(input: HTMLInputElement): void {
    input.value = '';
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
    if (this.readonly) {
      ixInput.select();
    }
  }

  blurred(): void {
    this.onTouch();
    if (this.formatted) {
      if (this.parse) {
        this.value = this.parse(this.formatted);
      }
      if (this.format) {
        this.formatted = this.format(this.value);
      }
    }

    this.onChange(this.value);
    this.cdr.markForCheck();
    this.inputBlur.emit();
  }

  onPasswordToggled(): void {
    this.showPassword = !this.showPassword;
  }
}
