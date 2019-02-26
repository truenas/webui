import {Inject, Injectable, Optional} from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import * as _ from 'lodash';

import {WebSocketService} from '../../../../../services/ws.service';
import {RestService} from '../../../../../services/rest.service';


import {FieldConfig} from '../models/field-config.interface';

@Injectable()
export class EntityFormService {

  constructor(@Inject(FormBuilder) private formBuilder: FormBuilder,
              protected ws: WebSocketService, private rest: RestService) {}

  createFormGroup(controls: FieldConfig[]) {
    const formGroup: {[id: string]: AbstractControl;} = {};

    if (controls) {
      for (let i = 0; i < controls.length; i++) {
        if (controls[i].formarray) {
          if (controls[i].initialCount == null) {
            controls[i].initialCount = 1;
          }

          const formArray = this.createFormArray(controls[i].formarray,
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
    const formArray = this.formBuilder.array([]);

    for (let i = 0; i < initialCount; i++) {
      const subFormGroup = this.createFormGroup(controls);
      formArray.push(subFormGroup);
    }
    return formArray;
  }

  insertFormArrayGroup(index: number, formArray: FormArray,
                       controls: FieldConfig[]) {
    const formGroup = this.createFormGroup(controls);
    formArray.insert(index, formGroup);
  }

  removeFormArrayGroup(index: number, formArray: FormArray) {
    formArray.removeAt(index);
  }

  getFilesystemListdirChildren(node: any, explorerType?: string, hideDirs?:any, showHiddenFiles = false ) {
    const children = [];

    return this.ws.call('filesystem.listdir', [node.data.name, [], {"order_by": ["name"]}] ).toPromise().then(res => {
      res = _.sortBy(res, function(o) { return o.name.toLowerCase(); });

      for (let i = 0; i < res.length; i++) {
        const child = {};
        if(!showHiddenFiles){
          if (res[i].hasOwnProperty('name') && !res[i].name.startsWith('.')) {
            if(explorerType === 'directory' && res[i].type !== 'DIRECTORY') {
              continue;
            }
            if(res[i].name !== hideDirs) {
                child['name'] = res[i].path;
                if(res[i].type === 'DIRECTORY') {
                  child['hasChildren'] = true;
                  }
                  child['subTitle'] = res[i].name;
                  children.push(child);
            }
          }

        }
        else{
          if (res[i].hasOwnProperty('name')) {
            if(explorerType === 'directory' && res[i].type !== 'DIRECTORY') {
              continue;
            }
            if(res[i].name !== hideDirs) {
              child['name'] = res[i].path;
              if(res[i].type === 'DIRECTORY') {
                child['hasChildren'] = true;
                }
                child['subTitle'] = res[i].name;
                children.push(child);
          }
          }
        }
      }
      return children;
    });
  }

  getDatasetsAndZvolsListChildren(node: any) {
    const children = [];

    return this.rest.get('storage/volume/', {}).toPromise().then(res => {
      res.data.forEach((vol) => {           
        children.push(vol.children[0]);
      });
      return children;
    });
  }
}