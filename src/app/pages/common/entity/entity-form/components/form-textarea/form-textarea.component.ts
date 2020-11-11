import {Component, ViewContainerRef, ViewChild, ElementRef} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';
import globalHelptext from '../../../../../../helptext/global-helptext';

@Component({
  selector : 'form-textarea',
  templateUrl : './form-textarea.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormTextareaComponent implements Field {
  @ViewChild('fileInput', { static: false}) fileInput: ElementRef<HTMLInputElement>;

  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  private hasPasteEvent = false;
  public fileString;

  constructor(public translate: TranslateService) {}
  
  blurEvent(){
    if(this.config.blurStatus){
      this.config.blurEvent(this.config.parent)
    }
  }

  onPaste(event: ClipboardEvent) {
    this.hasPasteEvent = true;
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData.getData('text');
    if (pastedText.startsWith(' ')) {
      this.config.warnings = globalHelptext.pasteValueStartsWithSpace;
    } else if (pastedText.endsWith(' ')) {
      this.config.warnings = globalHelptext.pasteValueEndsWithSpace;
    }
  }

  onInput() {
    if (this.hasPasteEvent) {
      this.hasPasteEvent = false;
    } else {
      this.config.warnings = null;
    }
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

  public fileBtnClick(){
    this.fileInput.nativeElement.click();
  }
}
