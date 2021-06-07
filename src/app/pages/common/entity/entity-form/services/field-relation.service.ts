import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/pages/common/entity/entity-form/models/relation-connection.enum';
import { FieldConfig } from '../models/field-config.interface';
import { FieldRelation, RelationGroup } from '../models/field-relation.interface';

@UntilDestroy()
@Injectable()
export class FieldRelationService {
  findActivationRelation(relGroups: RelationGroup[]): RelationGroup {
    return relGroups.find((rel) => {
      return [
        RelationAction.Disable,
        RelationAction.Enable,
        RelationAction.Show,
        RelationAction.Hide,
      ].includes(rel.action);
    });
  }

  getRelatedFormControls(model: FieldConfig,
    controlGroup: FormGroup): FormControl[] {
    const controls: FormControl[] = [];

    model.relation.forEach((relGroup) => relGroup.when.forEach((rel) => {
      if (model.name === rel.name) {
        throw new Error(`FormControl ${model.name} cannot depend on itself`);
      }
      const control = <FormControl>controlGroup.get(rel.name);
      if (control
          && !controls.some((controlElement) => controlElement === control)) {
        controls.push(control);
      } else {
        const subControlKeys = Object.keys(controlGroup.controls).filter((key) => key.startsWith(`${rel.name}_`));
        subControlKeys.forEach((key) => {
          const control = <FormControl>controlGroup.get(key);
          if (control
              && !controls.some((controlElement) => controlElement === control)) {
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
    formGroup: FormGroup, isDisable: boolean): boolean {
    return relGroup.when.reduce(
      (toBeDisabled: boolean, rel: FieldRelation, index: number) => {
        const control = formGroup.get(rel.name);
        let hasControlValue = false;
        let controlValue = null;

        if (control) {
          hasControlValue = true;
          controlValue = control.value;
        }

        let disable_action = RelationAction.Disable;
        let enable_action = RelationAction.Enable;
        if (!isDisable) {
          disable_action = RelationAction.Hide;
          enable_action = RelationAction.Show;
        }

        if (hasControlValue && relGroup.action === disable_action) {
          if (index > 0 && relGroup.connective === RelationConnection.And && !toBeDisabled) {
            return false;
          }
          if (index > 0 && relGroup.connective === RelationConnection.Or && toBeDisabled) {
            return true;
          }
          return this.checkValueConditionIsTrue(rel.value, controlValue, rel.operator) || this.checkStatusConditionIsTrue(rel, control);
        }

        if (hasControlValue && relGroup.action === enable_action) {
          if (index > 0 && relGroup.connective === RelationConnection.And && toBeDisabled) {
            return true;
          }
          if (index > 0 && relGroup.connective === RelationConnection.Or && !toBeDisabled) {
            return false;
          }
          return !(this.checkValueConditionIsTrue(rel.value, controlValue, rel.operator) || this.checkStatusConditionIsTrue(rel, control));
        }

        return false;
      },
      false,
    );
  }

  checkValueConditionIsTrue(conditionValue: any, controlValue: any, operator: string): boolean {
    let result = false;

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

  checkStatusConditionIsTrue(condition: any, control: any): boolean {
    return control && condition.status === control.status;
  }

  setRelation(config: FieldConfig, formGroup: FormGroup): void {
    if (config.relation && config.relation.length > 0) {
      const activations = this.findActivationRelation(config.relation);
      if (activations) {
        const tobeDisabled = this.isFormControlToBeDisabled(activations, formGroup);
        const tobeHide = this.isFormControlToBeHide(activations, formGroup);
        this.setDisabled(config, formGroup, tobeDisabled, tobeHide);

        this.getRelatedFormControls(config, formGroup).forEach((control) => {
          control.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
            this.relationUpdate(config, activations, formGroup);
          });
        });
      }
    }

    if (config.listFields) {
      const formArray = formGroup.get(config.name) as FormArray;
      for (let i = 0; i < config.listFields.length; i++) {
        config.listFields[i].forEach((subFieldConfig) => {
          this.setRelation(subFieldConfig, formArray.at(i) as FormGroup);
        });
      }
    }

    if (config.subFields) {
      const dictFormGroup = formGroup.get(config.name) as FormGroup;
      config.subFields.forEach((subFieldConfig) => {
        this.setRelation(subFieldConfig, dictFormGroup);
      });
    }
  }

  setDisabled(fieldConfig: FieldConfig, formGroup: FormGroup, disable: boolean, hide?: boolean): void {
    // if field is hidden, disable it too
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    fieldConfig.disabled = disable;
    fieldConfig.isHidden = hide;

    if (formGroup.controls[fieldConfig.name]) {
      const method = disable ? 'disable' : 'enable';
      formGroup.controls[fieldConfig.name][method]();
    }
  }

  relationUpdate(config: FieldConfig, activations: any, formGroup: FormGroup): void {
    const tobeDisabled = this.isFormControlToBeDisabled(activations, formGroup);
    const tobeHide = this.isFormControlToBeHide(activations, formGroup);
    this.setDisabled(config, formGroup, tobeDisabled, tobeHide);
  }

  isDeepEqual(data1: any, data2: any): boolean {
    if (this.getDataType(data1) != this.getDataType(data2)) {
      return false;
    }

    switch (this.getDataType(data1)) {
      case 'array':
        if (data1.length !== data2.length) {
          return false;
        }

        for (let i = 0; i < data2.length; i++) {
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

  getDataType(data: unknown): string {
    if (Array.isArray(data)) {
      return 'array';
    } if (data != null && typeof data === 'object') {
      return 'object';
    }
    return 'basic';
  }

  isRelationEqual(x: any, y: any): boolean {
    return this.isDeepEqual(x, y);
  }

  isRelationGreaterThan(x: any, y: any): boolean {
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

  isRelationGreaterThanOrEqual(x: any, y: any): boolean {
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

  isRelationLessThan(x: any, y: any): boolean {
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

  isRelationLessThanOrEqual(x: any, y: any): boolean {
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

  isRelationRegMatch(x: any, y: any): boolean {
    let result = false;
    if (typeof x == 'string' && typeof y == 'string') {
      result = !!x.match(y);
    }

    return result;
  }

  isRelationStartsWith(x: any, y: any): boolean {
    let result = false;
    if (typeof x == 'string' && typeof y == 'string') {
      result = x.startsWith(y);
    }

    return result;
  }

  isRelationEndsWith(x: any, y: any): boolean {
    let result = false;
    if (typeof x == 'string' && typeof y == 'string') {
      result = x.endsWith(y);
    }

    return result;
  }

  isRelationIn(x: any, y: any): boolean {
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
