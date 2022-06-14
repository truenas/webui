import {
  Component, ViewChild, ElementRef,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from 'app/helptext/global-helptext';
import { FormTextareaConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-textarea.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormTextareaComponent implements Field {
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;

  config: FormTextareaConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  private hasPasteEvent = false;
  fileString: string | ArrayBuffer;

  constructor(public translate: TranslateService) {}

  blurEvent(): void {
    if (this.config.blurStatus) {
      this.config.blurEvent();
    }
  }

  onPaste(event: ClipboardEvent): void {
    this.hasPasteEvent = true;
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData.getData('text');
    if (pastedText.startsWith(' ')) {
      this.config.warnings = globalHelptext.pasteValueStartsWithSpace;
    } else if (pastedText.endsWith(' ')) {
      this.config.warnings = globalHelptext.pasteValueEndsWithSpace;
    }
  }

  onInput(): void {
    if (this.hasPasteEvent) {
      this.hasPasteEvent = false;
    } else {
      this.config.warnings = null;
    }
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
    if (this.config.fileType === 'binary') {
      fReader.readAsBinaryString(file);
    } else {
      fReader.readAsText(file);
    }
  }

  contents(result: string | ArrayBuffer): void {
    if (this.config.fileType === 'binary') {
      this.group.controls[this.config.name].setValue(btoa(result as string));
    } else {
      this.group.controls[this.config.name].setValue(result);
    }
  }

  fileBtnClick(): void {
    this.fileInput.nativeElement.click();
  }
}
