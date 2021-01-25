import {Injectable} from "@angular/core";
import {FormControl, FormGroup} from "@angular/forms";

import {FieldConfig} from "../models/field-config.interface";
import {
  ACTION_DISABLE,
  ACTION_ENABLE,
  ACTION_SHOW,
  ACTION_HIDE,
  CONNECTION_AND,
  CONNECTION_OR,
  FieldRelation,
  RelationGroup
} from "../models/field-relation.interface";
import * as _ from 'lodash';
import { EntityUtils } from '../../utils';
@Injectable()
export class FieldRelationService {

  constructor() {}

  findActivationRelation(relGroups: RelationGroup[]): RelationGroup {
    return relGroups.find(rel => rel.action === ACTION_DISABLE ||
                                 rel.action === ACTION_ENABLE ||
                                 rel.action === ACTION_SHOW ||
                                 rel.action === ACTION_HIDE);
  }

  getRelatedFormControls(model: FieldConfig,
                         controlGroup: FormGroup): FormControl[] {
    let controls: FormControl[] = [];

    model.relation.forEach(relGroup => relGroup.when.forEach(rel => {
      if (model.name === rel.name) {
        throw new Error(`FormControl ${model.name} cannot depend on itself`);
      }
      let control = <FormControl>controlGroup.get(rel.name);
      if (control &&
          !controls.some(controlElement => controlElement === control)) {
        controls.push(control);
      }
    }));
    return controls;
  }

  isFormControlToBeDisabled(relGroup: RelationGroup,
                            formGroup: FormGroup): boolean {
    return this.isFormControlToBe(relGroup, formGroup, true);
  }
  
  isFormControlToBeHide(relGroup: RelationGroup,
    formGroup: FormGroup): boolean {
    return this.isFormControlToBe(relGroup, formGroup, false);
  }

  isFormControlToBe(relGroup: RelationGroup,
                            formGroup: FormGroup, isDisable:boolean): boolean {
    return relGroup.when.reduce(
        (toBeDisabled: boolean, rel: FieldRelation, index: number) => {
          let control = formGroup.get(rel.name);
          let hasControlValue = false;
          let controlValue = null;

          if (control) {
            hasControlValue = true;
            controlValue = control.value
          } else {
            let formGroupValue = _.cloneDeep(formGroup.value);
            let parsedValues = {};
            new EntityUtils().parseFormControlValues(formGroupValue, parsedValues);

            const key_list = rel.name.split('_');
            
            key_list.forEach(key => {
              if (parsedValues && parsedValues[key] != undefined) {
                parsedValues = parsedValues[key];
              } else {
                parsedValues = null;
              }
            });

            if (parsedValues) {
              hasControlValue = true;
              controlValue = parsedValues;
            }
          }

          let disable_action = ACTION_DISABLE;
          let enable_action = ACTION_ENABLE;
          if (!isDisable) {
            disable_action = ACTION_HIDE;
            enable_action = ACTION_SHOW;
          }
          
          if (hasControlValue && relGroup.action === disable_action) {
            if (index > 0 && relGroup.connective === CONNECTION_AND &&
                !toBeDisabled) {
              return false;
            }
            if (index > 0 && relGroup.connective === CONNECTION_OR &&
                toBeDisabled) {
              return true;
            }
            return this.checkValueConditionIsTrue(rel.value, controlValue, rel.operator) || this.checkStatusConditionIsTrue(rel, control);
          }

          if (hasControlValue && relGroup.action === enable_action) {
            if (index > 0 && relGroup.connective === CONNECTION_AND &&
                toBeDisabled) {
              return true;
            }
            if (index > 0 && relGroup.connective === CONNECTION_OR &&
                !toBeDisabled) {
              return false;
            }
            return !(this.checkValueConditionIsTrue(rel.value, controlValue, rel.operator) || this.checkStatusConditionIsTrue(rel, control));
          }

          return false;
        },
        false);
  }

  checkIsIn(value, list) {
    let result = false;
    if (Array.isArray(list)) {
      result = list.includes(value);
    } else if (this.isObject(list)) {
      if (this.isObject(value)) {
        result = this.deepEqual(list, value);
      } else {
        result = Object.keys(list).includes(value);
      }
    } else {
      result = `${list}`.includes(`${value}`);
    }

    return result;
  }

  checkValueConditionIsTrue(conditionValue:any, controlValue:any, operator:string) {
    let result:boolean = false;

    switch (operator) {
      case '!=':
        result = (controlValue != conditionValue);
        break;
      case '>':
        result = (controlValue > conditionValue);
        break;
      case '>=':
        result = (controlValue >= conditionValue);
        break;
      case '<':
        result = (controlValue < conditionValue);
        break;
      case '<=':
        result = (controlValue <= conditionValue);
        break;
      case '~':
        result = (controlValue.match(conditionValue));
        break;
      case 'in':
        result = this.checkIsIn(controlValue, conditionValue);
        break;
      case 'nin':
        result = !this.checkIsIn(controlValue, conditionValue);
        break;
      case 'rin':
        result = controlValue !== null && this.checkIsIn(conditionValue, controlValue);
        break;
      case 'rnin':
        result = controlValue !== null && !this.checkIsIn(conditionValue, controlValue);
        break;
      case '^':
        result = controlValue !== null && (controlValue.startsWith(conditionValue));
        break;
      case '!^':
        result = controlValue !== null && !(controlValue.startsWith(conditionValue));
        break;
      case '$':
        result = controlValue !== null && (controlValue.endsWith(conditionValue));
        break;
      case '!$':
        result = controlValue !== null && !(controlValue.endsWith(conditionValue));
        break;
      case '=':
      default:
        result = (controlValue == conditionValue);
    }

    return result;
  }

  checkStatusConditionIsTrue(condition:any, control:any) {
    return control && condition.status === control.status;
  }

  setRelation(config: FieldConfig, formGroup, fieldConfig) {
    const activations =
        this.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.isFormControlToBeDisabled(
          activations, formGroup);
      const tobeHide = this.isFormControlToBeHide(
          activations, formGroup);
      this.setDisabled(fieldConfig, formGroup, config.name, tobeDisabled, tobeHide);

      this.getRelatedFormControls(config, formGroup)
          .forEach(control => {
            control.valueChanges.subscribe(
                () => { this.relationUpdate(config, activations, formGroup, fieldConfig); });
          });
    }
  }

  setDisabled(fieldConfig: FieldConfig[], formGroup: any, name: string, disable: boolean, hide?: boolean, status?:string) {
    // if field is hidden, disable it too
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }


    fieldConfig = fieldConfig.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
        item['isHidden'] = hide;
      }
      return item;
    });

    if (formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      formGroup.controls[name][method]();
      return;
    }
  }

  relationUpdate(config: any, activations: any, formGroup: any, fieldConfig: FieldConfig[]) {
    const tobeDisabled = this.isFormControlToBeDisabled(
        activations, formGroup);
    const tobeHide = this.isFormControlToBeHide(
          activations, formGroup);
    this.setDisabled(fieldConfig, formGroup, config.name, tobeDisabled, tobeHide);
  }

  deepEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
  
    if (keys1.length !== keys2.length) {
      return false;
    }
  
    for (const key of keys1) {
      const val1 = object1[key];
      const val2 = object2[key];
      const areObjects = this.isObject(val1) && this.isObject(val2);
      if (
        areObjects && !this.deepEqual(val1, val2) ||
        !areObjects && val1 !== val2
      ) {
        return false;
      }
    }
  
    return true;
  }
  
  isObject(object) {
    return object != null && typeof object === 'object';
  }
  
}