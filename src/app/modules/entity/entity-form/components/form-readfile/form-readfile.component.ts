import { Component } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FormReadFileConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-readfile.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormReadFileComponent implements Field {
  config: FormReadFileConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  fileString: string | ArrayBuffer;

  constructor(public translate: TranslateService) {}

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
    fReader.readAsText(file);
  }

  contents(result: string | ArrayBuffer): void {
    this.group.controls[this.config.name].setValue(result);
  }
}
