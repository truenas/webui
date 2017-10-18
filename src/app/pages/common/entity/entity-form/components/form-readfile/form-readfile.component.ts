import {Component, ViewContainerRef} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {EntityFormService} from '../../services/entity-form.service';
import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-readfile',
  templateUrl : './form-readfile.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormReadFileComponent implements Field {
  constructor (private entityFormService : EntityFormService){}
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public fileString;
 
  changeListener($event): void {
    this.readFile($event.target);
  }

  readFile(inputValue: any): any {
    const file: File = inputValue.files[0];
    const fReader: FileReader = new FileReader();
    const fileType = inputValue.parentElement.id;
    fReader.onloadend = (e) => {
      console.log(fReader.result);
      this.fileString = fReader.result;
   };
   return fReader.readAsText(file);
   
  }

}


