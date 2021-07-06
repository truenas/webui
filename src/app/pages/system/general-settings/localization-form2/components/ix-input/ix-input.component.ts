import {
  Component, EventEmitter, forwardRef, Input, Output, ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from 'app/helptext/global-helptext';
import { InputUnitConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { ValueAccessorParent } from 'app/pages/system/general-settings/localization-form2/components/value-accessor-parent.class';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  templateUrl: 'ix-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IXInputComponent),
      multi: true,
    },
  ],
})
export class IXInputComponent extends ValueAccessorParent {
  @Output() inputBlur = new EventEmitter();
  @Input() blurStatus?: boolean;
  @Input() errors?: string;
  @Input() fileType?: string;
  @Input() filereader?: boolean;
  @Input() hasErrors?: boolean;
  @Input() hint?: string;
  @Input() inputType?: string;
  @Input() inputUnit?: InputUnitConfig;
  @Input() isHidden?: boolean;
  @Input() isLoading?: boolean;
  @Input() maskValue?: any;
  @Input() max?: number;
  @Input() min?: number;
  @Input() name: string;
  @Input() placeholder?: string;
  @Input() readonly?: boolean;
  @Input() required?: boolean;
  @Input() divider?: boolean;
  @Input() searchable?: boolean;
  @Input() togglePw?: boolean;
  @Input() tooltip?: string;
  @Input() tooltipPosition?: string;
  @Input() warnings?: string;
  @Input() hideErrMsg?: boolean;
  @Input() formInline: boolean;
  @Input() formControlName: string;
  @Input() formGroup: FormGroup;

  formControl = new FormControl();

  @ViewChild('fileInput', { static: true }) fileInput: HTMLInputElement;
  fieldShow: string;
  fileString: string | ArrayBuffer;
  showPassword = false;
  private hasPasteEvent = false;

  constructor(public translate: TranslateService,
    private formService: EntityFormService) {
    super();
  }

  changeListener($event: Event): void {
    this.readFile($event.target);
  }

  readFile(inputValue: any): void {
    const file: File = inputValue.files[0];
    const fReader: FileReader = new FileReader();

    fReader.onloadend = () => {
      this.fileString = fReader.result;
      this.contents(fReader.result);
    };
    if (this.fileType == 'binary') {
      fReader.readAsBinaryString(file);
    } else {
      fReader.readAsText(file);
    }
  }

  contents(result: any): void {
    result;
  }

  blurEvent(): void {
    this.inputBlur.emit({});
  }

  togglePW(): void {
    this.inputType = this.inputType === 'password' ? '' : 'password';
    this.showPassword = !this.showPassword;
  }

  valueChange(): void {
    if (this.inputUnit) {
      const phrasedValue = this.formService.phraseInputData(
        this.value,
        this.inputUnit,
      );
      if (isNaN(phrasedValue)) {
        this.formControl.setErrors({
          manualValidateError: true,
          manualValidateErrorMsg: globalHelptext.invalidInputValueWithUnit,
        });
      }
      if (phrasedValue) {
        this.formControl.setValue(phrasedValue);
      }
    }

    if (this.inputType == 'number') {
      const numberValue = this.value * 1;
      this.value = numberValue;
      if (this.min !== undefined && numberValue < this.min) {
        this.formControl.setErrors({
          manualValidateError: true,
          manualValidateErrorMsg: globalHelptext.invalidInputValueWithMin + this.min,
        });
      }

      if (this.max !== undefined && numberValue > this.max) {
        this.value.setErr;
        this.formControl.setErrors({
          manualValidateError: true,
          manualValidateErrorMsg: globalHelptext.invalidInputValueWithMax + this.max,
        });
      }
    }
  }

  hasValue(): boolean {
    return this.value && this.value.toString().length;
  }

  shouldShowResetInput(): boolean {
    return this.hasValue() && !this.readonly && !this.togglePw && this.inputType !== 'password';
  }

  resetInput(): void {
    this.value = '';
  }

  onPaste(event: ClipboardEvent): void {
    if (!this.inputType || this.inputType !== 'password') {
      this.hasPasteEvent = true;
      const clipboardData = event.clipboardData;
      const pastedText = clipboardData.getData('text');
      if (pastedText.startsWith(' ')) {
        this.warnings = globalHelptext.pasteValueStartsWithSpace;
      } else if (pastedText.endsWith(' ')) {
        this.warnings = globalHelptext.pasteValueEndsWithSpace;
      }
    }
  }

  onInput(): void {
    if (this.hasPasteEvent) {
      this.hasPasteEvent = false;
    } else {
      this.warnings = null;
    }
  }
}
