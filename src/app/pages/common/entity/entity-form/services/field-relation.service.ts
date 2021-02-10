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
import { EntityUtils, FORM_KEY_SEPERATOR } from '../../utils';
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
      } else {
        const subControlKeys = Object.keys(controlGroup.controls).filter(key => key.startsWith(`${rel.name}_`));
        subControlKeys.forEach(key => {
          let control = <FormControl>controlGroup.get(key);
          if (control &&
              !controls.some(controlElement => controlElement === control)) {
            controls.push(control);
          }
        });
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
            const key_list = rel.name.split(FORM_KEY_SEPERATOR);
            
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

  checkValueConditionIsTrue(conditionValue:any, controlValue:any, operator:string) {
    let result:boolean = false;

    switch (operator) {
      case '=':
        result = this.isRelationEqual(controlValue, conditionValue);
        break;
      case '!=':
        result = !this.isRelationEqual(controlValue, conditionValue);
        break;
      case '>':
        result = this.isRelationGreaterThan(controlValue, conditionValue);
        break;
      case '>=':
        result = this.isRelationGreaterThanOrEqual(controlValue, conditionValue);
        break;
      case '<':
        result = this.isRelationLessThan(controlValue, conditionValue);
        break;
      case '<=':
        result = this.isRelationGreaterThanOrEqual(controlValue, conditionValue);
        break;
      case '~':
        result = this.isRelationRegMatch(controlValue, conditionValue);
        break;
      case 'in':
        result = this.isRelationIn(controlValue, conditionValue);
        break;
      case 'nin':
        result = !this.isRelationIn(controlValue, conditionValue);
        break;
      case 'rin':
        result = this.isRelationIn(conditionValue, controlValue);
        break;
      case 'rnin':
        result = !this.isRelationIn(conditionValue, controlValue);
        break;
      case '^':
        result = this.isRelationStartsWith(controlValue, conditionValue);
        break;
      case '!^':
        result = !this.isRelationStartsWith(controlValue, conditionValue);
        break;
      case '$':
        result = this.isRelationEndsWith(controlValue, conditionValue);
        break;
      case '!$':
        result = !this.isRelationEndsWith(controlValue, conditionValue);
        break;
      default:
        result = this.isRelationEqual(controlValue, conditionValue);
    }

    return result;
  }

  checkStatusConditionIsTrue(condition:any, control:any) {
    return control && condition.status === control.status;
  }

  setRelation(config: FieldConfig, formGroup, fieldConfig) {
    const activations = this.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.isFormControlToBeDisabled(activations, formGroup);
      const tobeHide = this.isFormControlToBeHide(activations, formGroup);
      this.setDisabled(fieldConfig, formGroup, config.name, tobeDisabled, tobeHide);

      this.getRelatedFormControls(config, formGroup).forEach(control => {
        control.valueChanges.subscribe(() => { 
          this.relationUpdate(config, activations, formGroup, fieldConfig); 
        });
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
    const tobeDisabled = this.isFormControlToBeDisabled(activations, formGroup);
    const tobeHide = this.isFormControlToBeHide(activations, formGroup);
    this.setDisabled(fieldConfig, formGroup, config.name, tobeDisabled, tobeHide);
  }

  isDeepEqual(data1, data2) {
    if (this.getDataType(data1) != this.getDataType(data2)) {
      return false;
    }

    switch (this.getDataType(data1)) {
      case 'array':
        if (data1.length !== data2.length) {
          return false;
        }
      
        for (let i=0; i<data2.length; i++) {
          const val1 = data1[i];
          const val2 = data2[i];
          if (!this.isDeepEqual(val1, val2)) {
            return false;
          }
        }
        break;
      case 'object':
        const keys1 = Object.keys(data1);
        const keys2 = Object.keys(data2);
      
        if (keys1.length !== keys2.length) {
          return false;
        }
      
        for (const key of keys1) {
          const val1 = data1[key];
          const val2 = data2[key];
          if (!this.isDeepEqual(val1, val2)) {
            return false;
          }
        }
        break;
      case 'basic':
      default:
        if (data1 != data2) {
          return false;
        }
    }
  
    return true;
  }
  
  getDataType(data) {
    if (Array.isArray(data)) {
      return 'array';
    } else if (data != null && typeof data === 'object') {
      return 'object';
    } else {
      return 'basic';
    };
  }

  isRelationEqual(x, y) {
    return this.isDeepEqual(x, y);
  }

  isRelationGreaterThan(x, y) {
    let result = false;
    switch (this.getDataType(x)) {
      case 'array':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'object':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'basic':
      default:
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            result = (x > y);
            break;
        }
        break;
    }
    return result;
  }

  isRelationGreaterThanOrEqual(x, y) {
    let result = false;
    switch (this.getDataType(x)) {
      case 'array':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'object':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'basic':
      default:
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            result = (x >= y);
            break;
        }
        break;
    }
    return result;
  }

  isRelationLessThan(x, y) {
    let result = false;
    switch (this.getDataType(x)) {
      case 'array':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'object':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'basic':
      default:
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            result = (x < y);
            break;
        }
        break;
    }
    return result;
  }

  isRelationLessThanOrEqual(x, y) {
    let result = false;
    switch (this.getDataType(x)) {
      case 'array':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'object':
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            break;
        }
        break;
      case 'basic':
      default:
        switch (this.getDataType(y)) {
          case 'array':
            break;
          case 'object':
            break;
          case 'basic':
          default:
            result = (x <= y);
            break;
        }
        break;
    }
    return result;
  }

  isRelationRegMatch(x, y) {
    let result = false;
    if (typeof x == 'string' && typeof y == 'string') {
      result = !!x.match(y);
    }

    return result;
  }

  isRelationStartsWith(x, y) {
    let result = false;
    if (typeof x == 'string' && typeof y == 'string') {
      result = x.startsWith(y);
    }

    return result;
  }

  isRelationEndsWith(x, y) {
    let result = false;
    if (typeof x == 'string' && typeof y == 'string') {
      result = x.endsWith(y);
    }

    return result;
  }
  
  isRelationIn(x, y) {
    let result = false;

    if (y !== null) {
      switch (this.getDataType(y)) {
        case 'array':
          switch (this.getDataType(x)) {
            case 'array':
              break;
            case 'object':
              break;
            case 'basic':
            default:
              result = y.includes(x);
              break;
          }
          break;
        case 'object':
          switch (this.getDataType(x)) {
            case 'array':
              break;
            case 'object':
              break;
            case 'basic':
            default:
              result = Object.keys(y).includes(x);
              break;
          }
          break;
        case 'basic':
        default:
          switch (this.getDataType(x)) {
            case 'array':
              break;
            case 'object':
              break;
            case 'basic':
            default:
              result = `${y}`.includes(`${x}`);
              break;
          }
          break;
      }
    }

    return result;
  }
  
}