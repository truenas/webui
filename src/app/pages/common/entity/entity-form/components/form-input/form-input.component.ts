import { Component, Output, ViewChild, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { EntityFormService } from '../../services/entity-form.service';
import { Field } from '../../models/field.interface';
import globalHelptext from '../../../../../../helptext/global-helptext';

@Component({
  selector: 'form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss', '../dynamic-field/dynamic-field.css'],
})
export class FormInputComponent implements Field {
  @ViewChild('fileInput', { static: true}) fileInput;
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public fileString;
  public showPassword = false;
  private hasPasteEvent = false;

  constructor(public translate: TranslateService,
    private formService: EntityFormService) {
  }

  changeListener($event): void {
    this.readFile($event.target);
  }

  readFile(inputValue: any) {
    var file: File = inputValue.files[0];
    var fReader: FileReader = new FileReader();

    fReader.onloadend = (e) => {
      this.fileString = fReader.result;
      this.contents(fReader.result);
    }
    if (this.config.fileType == 'binary') {
      fReader.readAsBinaryString(file);
    } else {
      fReader.readAsText(file);
    }
  }

  contents(result:any) {
    if (this.config.fileType == 'binary'){
      this.group.controls[this.config.name].setValue(btoa(result));
    } else {
      this.group.controls[this.config.name].setValue(result);
    }
  }

  blurEvent(){
    if(this.config.blurStatus){
      this.config.blurEvent(this.config.parent)
    }
  }

  togglePW() {
    this.config.inputType = this.config.inputType === 'password' ? '' : 'password';
    this.showPassword = !this.showPassword;
  }

  valueChange() {
    if (this.config.inputUnit) {
      const phrasedValue = this.formService.phraseInputData(this.group.controls[this.config.name].value, this.config.inputUnit);
      if (isNaN(phrasedValue)) {
        this.group.controls[this.config.name].setErrors({manualValidateError: true, manualValidateErrorMsg: globalHelptext.invalidInputValueWithUnit});
      }
      if (phrasedValue) {
        this.group.controls[this.config.name].setValue(phrasedValue);
      }
    }

    if (this.config.inputType == 'number') {
      const numberValue = this.group.controls[this.config.name].value * 1;
      this.group.controls[this.config.name].setValue(numberValue);
    }
  }

  hasValue() {
    return this.group.controls[this.config.name].value && this.group.controls[this.config.name].value.toString().length;
  }

  shouldShowResetInput() {
    return this.hasValue() && !this.config.readonly && !this.config.togglePw && this.config.inputType !== 'password';
  }

  resetInput() {
    this.group.controls[this.config.name].setValue('');
  }
  
  onPaste(event: ClipboardEvent) {
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

  onInput() {
    if (this.hasPasteEvent) {
      this.hasPasteEvent = false;
    } else {
      this.config.warnings = null;
    }
  }

}
