import {
  Component, ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from 'app/helptext/global-helptext';
import { FormInputConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss', '../dynamic-field/dynamic-field.scss'],
})
export class FormInputComponent implements Field {
  @ViewChild('fileInput', { static: true }) fileInput: HTMLInputElement;
  config: FormInputConfig;
  group: FormGroup;
  fieldShow: string;
  fileString: string | ArrayBuffer;
  showPassword = false;
  private hasPasteEvent = false;

  constructor(public translate: TranslateService,
    private formService: EntityFormService) {
  }

  changeListener($event: Event): void {
    this.readFile($event.target as HTMLInputElement);
  }

  readFile(inputValue: HTMLInputElement): void {
    const file: File = inputValue.files[0];
    const fReader: FileReader = new FileReader();

    fReader.onloadend = () => {
      this.fileString = fReader.result;
      this.contents(fReader.result);
    };
    if (this.config.fileType == 'binary') {
      fReader.readAsBinaryString(file);
    } else {
      fReader.readAsText(file);
    }
  }

  contents(result: string | ArrayBuffer): void {
    if (this.config.fileType == 'binary') {
      this.group.controls[this.config.name].setValue(btoa(result as string));
    } else {
      this.group.controls[this.config.name].setValue(result);
    }
  }

  blurEvent(): void {
    if (this.config.blurStatus) {
      this.config.blurEvent();
    }
  }

  togglePW(): void {
    this.config.inputType = this.config.inputType === 'password' ? '' : 'password';
    this.showPassword = !this.showPassword;
  }

  valueChange(): void {
    if (this.config.inputUnit) {
      const phrasedValue = this.formService.phraseInputData(
        this.group.controls[this.config.name].value,
        this.config.inputUnit,
      );
      if (isNaN(phrasedValue as number)) {
        this.group.controls[this.config.name].setErrors({
          manualValidateError: true,
          manualValidateErrorMsg: globalHelptext.invalidInputValueWithUnit,
        });
      }
      if (phrasedValue) {
        this.group.controls[this.config.name].setValue(phrasedValue);
      }
    }

    if (this.config.inputType == 'number') {
      const numberValue = this.group.controls[this.config.name].value * 1;
      this.group.controls[this.config.name].setValue(numberValue);
      if (this.config.min !== undefined && numberValue < this.config.min) {
        this.group.controls[this.config.name].setErrors({
          manualValidateError: true,
          manualValidateErrorMsg: globalHelptext.invalidInputValueWithMin + this.config.min,
        });
      }

      if (this.config.max !== undefined && numberValue > this.config.max) {
        this.group.controls[this.config.name].setErrors({
          manualValidateError: true,
          manualValidateErrorMsg: globalHelptext.invalidInputValueWithMax + this.config.max,
        });
      }
    }
  }

  hasValue(): boolean {
    return this.group.controls[this.config.name].value && this.group.controls[this.config.name].value.toString().length;
  }

  shouldShowResetInput(): boolean {
    return this.hasValue() && !this.config.readonly && !this.config.togglePw && this.config.inputType !== 'password' && !this.config.disabled;
  }

  resetInput(): void {
    this.group.controls[this.config.name].setValue('');
  }

  onPaste(event: ClipboardEvent): void {
    if (!this.config.inputType || this.config.inputType !== 'password') {
      this.hasPasteEvent = true;
      const clipboardData = event.clipboardData;
      const pastedText = clipboardData.getData('text');
      if (pastedText.startsWith(' ')) {
        this.config.warnings = globalHelptext.pasteValueStartsWithSpace;
      } else if (pastedText.endsWith(' ')) {
        this.config.warnings = globalHelptext.pasteValueEndsWithSpace;
      }
    }
  }

  onInput(): void {
    if (this.hasPasteEvent) {
      this.hasPasteEvent = false;
    } else {
      this.config.warnings = null;
    }
  }
}
