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

  getFilesystemListdir(dir: string) {
    let children = [];
    this.ws.call('filesystem.listdir', [dir]).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        let child = {};
        if (res[i].hasOwnProperty('name')) {
          child['value'] = res[i].name;
          //if(res[i].type === 'DIRECTORY') {
          //  child['children'] = this.getFilesystemListdir(res[i].path);
          //}
          child['path'] = res[i].path;
          children.push(child);
        }
      }
    });
    return children;
  }

  getChildrenYo(callback: Function, dir: string): void {
    debugger;
    this.ws.call('filesystem.listdir', [dir]).subscribe((res) => {
      let children = []
      for (let i = 0; i < res.length; i++) {
        let child = {};
        if (res[i].hasOwnProperty('name')) {
          child['value'] = res[i].name;
          // child['path'] = res[i].path;
          if(res[i].type === 'DIRECTORY') {
            child['loadChildren'] = (nextCallback) => this.getChildrenYo(nextCallback, res[i].path);
          }
          children.push(child);
        }
      }
      callback(children);
    });
  }
}
