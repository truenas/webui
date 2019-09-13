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
    return relGroup.when.reduce(
        (toBeDisabled: boolean, rel: FieldRelation, index: number) => {
          let control = formGroup.get(rel.name);

          if (control && relGroup.action === ACTION_DISABLE) {
            if (index > 0 && relGroup.connective === CONNECTION_AND &&
                !toBeDisabled) {
              return false;
            }
            if (index > 0 && relGroup.connective === CONNECTION_OR &&
                toBeDisabled) {
              return true;
            }
            return rel.value === control.value || rel.status === control.status;
          }

          if (control && relGroup.action === ACTION_ENABLE) {
            if (index > 0 && relGroup.connective === CONNECTION_AND &&
                toBeDisabled) {
              return true;
            }
            if (index > 0 && relGroup.connective === CONNECTION_OR &&
                !toBeDisabled) {
              return false;
            }
            return !(rel.value === control.value ||
                     rel.status === control.status);
          }
          return false;
        },
        false);
  }

  isFormControlToBeHide(relGroup: RelationGroup,
                            formGroup: FormGroup): boolean {
    return relGroup.when.reduce(
        (toBeHide: boolean, rel: FieldRelation, index: number) => {
          let control = formGroup.get(rel.name);

          if (control && relGroup.action === ACTION_HIDE) {
            if (index > 0 && relGroup.connective === CONNECTION_AND &&
                !toBeHide) {
              return false;
            }
            if (index > 0 && relGroup.connective === CONNECTION_OR &&
                toBeHide) {
              return true;
            }
            return rel.value === control.value || rel.status === control.status;
          }

          if (control && relGroup.action === ACTION_SHOW) {
            if (index > 0 && relGroup.connective === CONNECTION_AND &&
                toBeHide) {
              return true;
            }
            if (index > 0 && relGroup.connective === CONNECTION_OR &&
                !toBeHide) {
              return false;
            }
            return !(rel.value === control.value ||
                     rel.status === control.status);
          }
          return false;
        },
        false);
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
}