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

  public durationRegex = /^\s*((MINUTE|HOUR|DAY|WEEK|MONTH|YEAR){1}(S)?)|((M|h|d|w|m|y){1})\s*$/;
  public storageRegex = /^\s*(KIB|MIB|GIB|TIB|PIB|KB|MB|GB|TB|PB|K|M|G|T|P){1}\s*$/;

  public shortDurationUnit = {
    M: 'MINUTE',
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    m: 'MONTH',
    y: 'YEAR',
  }

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
        } else if (controls[i].listFields) {
          formGroup[controls[i].name] = this.formBuilder.array([]);
        } else {
          formGroup[controls[i].name] = new FormControl(
              {value : controls[i].value, disabled : controls[i].disabled},
              controls[i].type === 'input-list' ? [] : controls[i].validation);
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
    let typeFilter;
    explorerType && explorerType === 'directory' ? typeFilter = [['type', '=', 'DIRECTORY']] : typeFilter = [];

    return this.ws.call('filesystem.listdir', [node.data.name, typeFilter, 
      {"order_by": ["name"], 'limit': 1000}] ).toPromise().then(res => {
      res = _.sortBy(res, function(o) { return o.name.toLowerCase(); });

      for (let i = 0; i < res.length; i++) {
        const child = {};
        if(!showHiddenFiles){
          if (res[i].hasOwnProperty('name') && !res[i].name.startsWith('.')) {
            if(res[i].type === 'SYMLINK') {
              continue;
            }
            if(res[i].name !== hideDirs) {
                child['name'] = res[i].path;
                child['acl'] = res[i].acl;
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
            if(res[i].type === 'SYMLINK') {
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
      if (children.length === 0) {
        node.data.hasChildren = false;
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

  getPoolDatasets(param = []) {
    const nodes = [];
    return this.ws.call('pool.filesystem_choices', param).toPromise().then((res)=> {
      for (let i = 0; i < res.length; i++) {
        const pathArr = res[i].split('/');
        if (pathArr.length === 1) {
            const node = {
                name: res[i],
                subTitle: pathArr[0],
                hasChildren: false,
                children: [],
            };
            nodes.push(node);
        } else {
            let parent = _.find(nodes, {'name': pathArr[0]});
            let j = 1;
            while(_.find(parent.children, {'subTitle': pathArr[j]})) {
                parent = _.find(parent.children, {'subTitle': pathArr[j++]});
            }
            const node = {
                name: res[i],
                subTitle: pathArr[j],
                hasChildren: false,
                children: [],
            };
            parent.children.push(node);
            parent.hasChildren = true;
        }
      }
      return nodes;
    })
  }

  clearFormError(fieldConfig) {
    for (let f = 0; f < fieldConfig.length; f++) {
      fieldConfig[f]['errors'] = '';
      fieldConfig[f]['hasErrors'] = false;
    }
  }

  phraseInputData(value: any, type: string) {
    if (!value) {
      return value;
    }
    let num = 0;
    let unit = '';

    // remove whitespace
    value = value.replace(/\s+/g, '');

    // get leading number
    let match = [];
    match = value.match(/^(\d+(\.\d+)?)/);
    if (match && match.length > 0) {
      num = match[1];
    } else {
      return NaN;
    }

    unit = value.replace(num, '');
    unit = unit.length > 1 ? unit.toUpperCase() : unit;

    const matchUnits = unit.match(this.durationRegex);
    if (matchUnits && matchUnits[0] === unit) {
      return num + ' ' + this.getHumanReadableUnit(num, unit);
    } else {
      return NaN;
    }
  }

  getHumanReadableUnit(num, unit) {
    let readableUnit = unit.length > 1 ? unit : this.shortDurationUnit[unit];
    if (num <= 1 && _.endsWith(readableUnit, 'S')) {
      readableUnit = readableUnit.substring(0, readableUnit.length - 1);
    } else if(num >1 && !_.endsWith(readableUnit, 'S')) {
      readableUnit += 'S';
    }
    return readableUnit;
  }
}