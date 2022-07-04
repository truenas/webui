import { Injectable } from '@angular/core';
import {
  AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  FieldConfig,
  FormDictConfig,
  FormListConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldRelation, RelationGroup } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/modules/entity/entity-form/models/relation-connection.enum';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
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

  getRelatedFormControls(config: FieldConfig,
    controlGroup: UntypedFormGroup): UntypedFormControl[] {
    const controls: UntypedFormControl[] = [];

    config.relation.forEach((relGroup) => relGroup.when.forEach((rel) => {
      if (config.name === rel.name) {
        throw new Error(`FormControl ${config.name} cannot depend on itself`);
      }
      const control = controlGroup.get(rel.name) as UntypedFormControl;
      if (control
          && !controls.some((controlElement) => controlElement === control)) {
        controls.push(control);
      } else {
        const subControlKeys = Object.keys(controlGroup.controls).filter((key) => key.startsWith(`${rel.name}_`));
        subControlKeys.forEach((key) => {
          const control = controlGroup.get(key) as UntypedFormControl;
          if (control
              && !controls.some((controlElement) => controlElement === control)) {
            controls.push(control);
          }
        });
      }
    }));
    return controls;
  }

  isFormControlToBeDisabled(relGroup: RelationGroup, formGroup: UntypedFormGroup): boolean {
    return this.isFormControlToBe(relGroup, formGroup, true);
  }

  isFormControlToBeHide(relGroup: RelationGroup, formGroup: UntypedFormGroup): boolean {
    return this.isFormControlToBe(relGroup, formGroup, false);
  }

  isFormControlToBe(
    relGroup: RelationGroup,
    formGroup: UntypedFormGroup,
    isDisable: boolean,
  ): boolean {
    return relGroup.when.reduce(
      (toBeDisabled: boolean, rel: FieldRelation, index: number) => {
        const control = formGroup.get(rel.name);
        let hasControlValue = false;
        let controlValue = null;

        if (control) {
          hasControlValue = true;
          controlValue = control.value;
        }

        let disableAction = RelationAction.Disable;
        let enableAction = RelationAction.Enable;
        if (!isDisable) {
          disableAction = RelationAction.Hide;
          enableAction = RelationAction.Show;
        }

        if (hasControlValue && relGroup.action === disableAction) {
          if (index > 0 && relGroup.connective === RelationConnection.And && !toBeDisabled) {
            return false;
          }
          if (index > 0 && relGroup.connective === RelationConnection.Or && toBeDisabled) {
            return true;
          }
          return this.checkValueConditionIsTrue(rel.value, controlValue, rel.operator)
            || this.checkStatusConditionIsTrue(rel, control);
        }

        if (hasControlValue && relGroup.action === enableAction) {
          if (index > 0 && relGroup.connective === RelationConnection.And && toBeDisabled) {
            return true;
          }
          if (index > 0 && relGroup.connective === RelationConnection.Or && !toBeDisabled) {
            return false;
          }
          return !(this.checkValueConditionIsTrue(rel.value, controlValue, rel.operator)
            || this.checkStatusConditionIsTrue(rel, control));
        }

        return false;
      },
      false,
    );
  }

  checkValueConditionIsTrue(conditionValue: unknown, controlValue: unknown, operator: string): boolean {
    let result: boolean;

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

  checkStatusConditionIsTrue(condition: FieldRelation, control: AbstractControl): boolean {
    return control && condition.status === control.status;
  }

  setRelation(config: FieldConfig, formGroup: UntypedFormGroup): void {
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

    const listConfig: FormListConfig = config as FormListConfig;
    if (listConfig.listFields) {
      const formArray = formGroup.get(config.name) as UntypedFormArray;
      for (let i = 0; i < listConfig.listFields.length; i++) {
        listConfig.listFields[i].forEach((subFieldConfig) => {
          this.setRelation(subFieldConfig, formArray.at(i) as UntypedFormGroup);
        });
      }
    }

    const dictConfig: FormDictConfig = config as FormDictConfig;
    if (dictConfig.subFields) {
      const dictFormGroup = formGroup.get(config.name) as UntypedFormGroup;
      dictConfig.subFields.forEach((subFieldConfig) => {
        this.setRelation(subFieldConfig, dictFormGroup);
      });
    }
  }

  /**
   * Manually executes a relationship check and hides/shows controls.
   * @param options
   * * `emitEvent`: Similarly to emitEvent in angular form controls.
   * When true (default) will trigger valueChanges and statusChanges.
   */
  refreshRelations(
    config: FieldConfig,
    formGroup: UntypedFormGroup,
    options: { emitEvent: boolean } = { emitEvent: true },
  ): void {
    if (config.relation && config.relation.length > 0) {
      const activations = this.findActivationRelation(config.relation);
      if (activations) {
        const tobeDisabled = this.isFormControlToBeDisabled(activations, formGroup);
        const tobeHide = this.isFormControlToBeHide(activations, formGroup);
        this.setDisabled(config, formGroup, tobeDisabled, tobeHide, options);
      }
    }

    const listConfig: FormListConfig = config as FormListConfig;
    if (listConfig.listFields) {
      const formArray = formGroup.get(listConfig.name) as UntypedFormArray;
      for (let i = 0; i < listConfig.listFields.length; i++) {
        listConfig.listFields[i].forEach((subFieldConfig) => {
          this.refreshRelations(subFieldConfig, formArray.at(i) as UntypedFormGroup);
        });
      }
    }

    const dictConfig: FormDictConfig = config as FormDictConfig;
    if (dictConfig.subFields) {
      const dictFormGroup = formGroup.get(config.name) as UntypedFormGroup;
      dictConfig.subFields.forEach((subFieldConfig) => {
        this.refreshRelations(subFieldConfig, dictFormGroup);
      });
    }
  }

  setDisabled(
    fieldConfig: FieldConfig,
    formGroup: UntypedFormGroup,
    disable: boolean,
    hide?: boolean,
    options: { emitEvent: boolean } = { emitEvent: true },
  ): void {
    // if field is hidden, disable it too
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    fieldConfig.disabled = disable;
    fieldConfig.isHidden = hide;

    if (formGroup.controls[fieldConfig.name]) {
      if (disable) {
        formGroup.controls[fieldConfig.name].disable(options);
      } else {
        formGroup.controls[fieldConfig.name].enable(options);
      }
    }
  }

  relationUpdate(config: FieldConfig, activations: RelationGroup, formGroup: UntypedFormGroup): void {
    const tobeDisabled = this.isFormControlToBeDisabled(activations, formGroup);
    const tobeHide = this.isFormControlToBeHide(activations, formGroup);
    this.setDisabled(config, formGroup, tobeDisabled, tobeHide);
  }

  isDeepEqual(data1: unknown, data2: unknown): boolean {
    if (this.getDataType(data1) !== this.getDataType(data2)) {
      return false;
    }

    switch (this.getDataType(data1)) {
      case 'array':
        if ((data1 as unknown[]).length !== (data2 as unknown[]).length) {
          return false;
        }

        for (let i = 0; i < (data2 as unknown[]).length; i++) {
          const val1 = (data1 as unknown[])[i];
          const val2 = (data2 as unknown[])[i];
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
          const val1 = (data1 as Record<string, unknown>)[key];
          const val2 = (data2 as Record<string, unknown>)[key];
          if (!this.isDeepEqual(val1, val2)) {
            return false;
          }
        }
        break;
      case 'basic':
      default:
        if (data1 !== data2) {
          return false;
        }
    }

    return true;
  }

  getDataType(data: unknown): string {
    if (Array.isArray(data)) {
      return 'array';
    } if (data !== null && typeof data === 'object') {
      return 'object';
    }
    return 'basic';
  }

  isRelationEqual(x: unknown, y: unknown): boolean {
    return this.isDeepEqual(x, y);
  }

  isRelationGreaterThan(x: unknown, y: unknown): boolean {
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

  isRelationGreaterThanOrEqual(x: unknown, y: unknown): boolean {
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

  isRelationLessThan(x: unknown, y: unknown): boolean {
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

  isRelationLessThanOrEqual(x: unknown, y: unknown): boolean {
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

  isRelationRegMatch(x: unknown, y: unknown): boolean {
    let result = false;
    if (typeof x === 'string' && typeof y === 'string') {
      result = !!x.match(y);
    }

    return result;
  }

  isRelationStartsWith(x: unknown, y: unknown): boolean {
    let result = false;
    if (typeof x === 'string' && typeof y === 'string') {
      result = x.startsWith(y);
    }

    return result;
  }

  isRelationEndsWith(x: unknown, y: unknown): boolean {
    let result = false;
    if (typeof x === 'string' && typeof y === 'string') {
      result = x.endsWith(y);
    }

    return result;
  }

  isRelationIn(x: unknown, y: unknown): boolean {
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
              result = (y as unknown[]).includes(x);
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
              result = Object.keys(y).includes(x as string);
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
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              result = `${y}`.includes(`${x}`);
              break;
          }
          break;
      }
    }

    return result;
  }
}
