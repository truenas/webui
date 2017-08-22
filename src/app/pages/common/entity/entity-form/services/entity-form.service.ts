import {Inject, Injectable, Optional} from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import { WebSocketService } from '../../../../../services/';
import 'rxjs/add/operator/toPromise';

import {FieldConfig} from '../models/field-config.interface';

@Injectable()
export class EntityFormService {

  constructor(@Inject(FormBuilder) private formBuilder: FormBuilder,
              protected ws: WebSocketService) {}

  createFormGroup(controls: FieldConfig[]) {
    let formGroup: {[id: string] : AbstractControl;} = {};

    if (controls) {
      for (let i = 0; i < controls.length; i++) {
        if (controls[i].formarray) {
          if (controls[i].initialCount == null) {
            controls[i].initialCount = 1;
          }

          let formArray = this.createFormArray(controls[i].formarray,
                                               controls[i].initialCount);
          formGroup[controls[i].name] = formArray;
        } else {
          formGroup[controls[i].name] = new FormControl(
              {value : controls[i].value, disabled : controls[i].disabled},
              controls[i].validation);
        }

        controls[i].relation =
            Array.isArray(controls[i].relation) ? controls[i].relation : [];
      }
    }

    return this.formBuilder.group(formGroup);
  }

  createFormArray(controls: FieldConfig[], initialCount: number) {
    let formArray = this.formBuilder.array([]);

    for (let i = 0; i < initialCount; i++) {
      let subFormGroup = this.createFormGroup(controls);
      formArray.push(subFormGroup);
    }
    return formArray;
  }

  insertFormArrayGroup(index: number, formArray: FormArray,
                       controls: FieldConfig[]) {
    let formGroup = this.createFormGroup(controls);
    formArray.insert(index, formGroup);
  }

  removeFormArrayGroup(index: number, formArray: FormArray) {
    formArray.removeAt(index);
  }

  getFilesystemListdirChildren(node: any) {
    let children = [];
    return this.ws.call('filesystem.listdir', [node.data.name]).toPromise().then(res => {
      for (let i = 0; i < res.length; i++) {
        let child = {};
        if (res[i].hasOwnProperty('name')) {
          child['name'] = res[i].path;
          if(res[i].type === 'DIRECTORY') {
            child['hasChildren'] = true;
          }
          child['subTitle'] = res[i].name;
          children.push(child);
        }
      }
      return children;
    });
  }
}